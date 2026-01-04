import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * POST /api/rfq/assign-job
 * 
 * Assigns an RFQ to a vendor who has submitted an accepted quote.
 * Creates a project record and notifies the vendor.
 * 
 * Body:
 * {
 *   rfqId: string,
 *   vendorId: string,
 *   startDate: string (ISO date),
 *   notes?: string
 * }
 */

export async function POST(req) {
  const { rfqId, vendorId, startDate, notes } = await req.json()

  try {
    // Validate inputs
    if (!rfqId || !vendorId || !startDate) {
      return Response.json(
        { error: 'Missing required fields: rfqId, vendorId, startDate' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // [1] Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user || userError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // [2] Verify user owns the RFQ
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('id, user_id, title, category')
      .eq('id', rfqId)
      .single()

    if (rfqError || !rfq) {
      console.error('RFQ fetch error:', rfqError)
      return Response.json({ error: 'RFQ not found' }, { status: 404 })
    }

    if (rfq.user_id !== user.id) {
      return Response.json(
        { error: 'You do not own this RFQ' },
        { status: 403 }
      )
    }

    // [3] Verify quote from vendor exists and is accepted
    const { data: quote, error: quoteError } = await supabase
      .from('rfq_responses')
      .select('id, vendor_id, amount, message')
      .eq('rfq_id', rfqId)
      .eq('vendor_id', vendorId)
      .eq('status', 'accepted')
      .single()

    if (quoteError || !quote) {
      console.error('Quote fetch error:', quoteError)
      return Response.json(
        { error: 'No accepted quote from this vendor for this RFQ' },
        { status: 400 }
      )
    }

    // [4] Create project assignment
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        rfq_id: rfqId,
        assigned_vendor_id: vendorId,
        assigned_by_user_id: user.id,
        status: 'pending',
        start_date: startDate,
        notes: notes || null
      })
      .select()
      .single()

    if (projectError) {
      console.error('Project creation error:', projectError)
      return Response.json(
        { error: 'Failed to create project assignment: ' + projectError.message },
        { status: 400 }
      )
    }

    // [5] Update RFQ status to 'assigned'
    const { error: rfqUpdateError } = await supabase
      .from('rfqs')
      .update({
        status: 'assigned',
        assigned_vendor_id: vendorId,
        assigned_at: new Date().toISOString()
      })
      .eq('id', rfqId)

    if (rfqUpdateError) {
      console.error('RFQ update error:', rfqUpdateError)
      // Don't fail the entire operation, but log it
    }

    // [6] Get vendor details for notification
    const { data: vendor, error: vendorError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', vendorId)
      .single()

    const vendorName = vendor?.full_name || 'Vendor'

    // [7] Get buyer details for vendor notification
    const { data: buyer, error: buyerError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', user.id)
      .single()

    const buyerName = buyer?.full_name || 'A client'

    // [8] Create notification for VENDOR (they've been assigned)
    const vendorNotificationData = {
      user_id: vendorId,
      type: 'job_assigned',
      title: `🎉 You've Been Hired - "${rfq.title}"`,
      message: `${buyerName} has assigned you the "${rfq.title}" project. Start date: ${new Date(startDate).toLocaleDateString()}. Review the details and confirm your acceptance.`,
      related_rfq_id: rfqId,
      related_project_id: project.id,
      related_user_id: user.id,
      action_url: `/projects/${project.id}`
    }

    const { error: vendorNotifError } = await supabase
      .from('notifications')
      .insert(vendorNotificationData)

    if (vendorNotifError) {
      console.error('Vendor notification creation error:', vendorNotifError)
      // Don't fail the operation
    }

    // [9] Create notification for BUYER (confirmation of assignment)
    const buyerNotificationData = {
      user_id: user.id,
      type: 'job_assigned',
      title: `✓ ${vendorName} Has Been Assigned`,
      message: `You have successfully assigned "${rfq.title}" to ${vendorName}. They will receive a notification and can review the project details.`,
      related_rfq_id: rfqId,
      related_project_id: project.id,
      related_user_id: vendorId,
      action_url: `/projects/${project.id}`
    }

    const { error: buyerNotifError } = await supabase
      .from('notifications')
      .insert(buyerNotificationData)

    if (buyerNotifError) {
      console.error('Buyer notification creation error:', buyerNotifError)
      // Don't fail the operation
    }

    // [10] Success response
    return Response.json({
      success: true,
      project,
      message: `Successfully assigned ${rfq.title} to ${vendorName}. Notifications have been sent.`
    })

  } catch (error) {
    console.error('Job assignment error:', error)
    return Response.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/rfq/assign-job?projectId=xxx
 * 
 * Retrieves project details for display
 */

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return Response.json(
      { error: 'projectId query parameter is required' },
      { status: 400 }
    )
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!user || userError) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get project with RFQ details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        rfq_id,
        assigned_vendor_id,
        assigned_by_user_id,
        status,
        start_date,
        expected_end_date,
        notes,
        created_at,
        rfqs(id, title, description, category),
        assigned_vendor:profiles!assigned_vendor_id(id, full_name, email, phone),
        assigned_by:profiles!assigned_by_user_id(id, full_name, email)
      `)
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check authorization (user must be creator or assigned vendor)
    if (user.id !== project.assigned_by_user_id && user.id !== project.assigned_vendor_id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return Response.json(project)

  } catch (error) {
    console.error('Project fetch error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
