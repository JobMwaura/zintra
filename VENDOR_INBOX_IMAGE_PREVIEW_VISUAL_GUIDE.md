# 🖼️ Vendor Inbox Image Preview - Visual Guide

## 📐 UI Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     VENDOR INBOX MODAL                      │
├─────────────────────────────────────────────────────────────┤
│  📧 Messages                                            [X]  │
│  2 unread                                                   │
├────────────────────────────┬────────────────────────────────┤
│   CONVERSATION LIST        │      MESSAGE THREAD            │
│                            │                                │
│ ☐ Admin Name               │  Admin: "Check this image"     │
│   Preview text...          │  ┌──────────────────────────┐  │
│   2 msgs, 1 unread        │  │  [Clickable Image]       │  │
│                            │  │  📷 photo.jpg           │  │
│ ☐ Admin Name 2             │  │  Hover → opacity: 80%   │  │
│   Preview text...          │  └──────────────────────────┘  │
│   5 msgs, 0 unread        │  2:30 PM                        │
│                            │                                │
│                            │  Vendor: "Perfect, thanks!"    │
│                            │  2:35 PM                       │
│                            │                                │
│                            │  ┌─────────────────────────┐   │
│                            │  │ [Message Input]        │   │
│                            │  │ [📎] [→]               │   │
│                            │  └─────────────────────────┘   │
└────────────────────────────┴────────────────────────────────┘
```

## 🎬 User Interaction Flow

### Step 1: View Message with Image
```
User opens conversation
    ↓
Sees message: "Admin: Here's the document"
    ↓
Image displays as thumbnail below message
    └─ Size: max-w-xs (448px max)
    └─ Rounded corners
    └─ Shows: hover effect on mouse over
```

### Step 2: Click Image
```
User clicks image thumbnail
    ↓
onClick={() => setSelectedImage(att)}
    ↓
Component re-renders
    ↓
selectedImage state = {
  name: "photo.jpg",
  url: "https://...",
  type: "image/jpeg",
  size: 245632
}
```

### Step 3: Lightbox Opens
```
Lightbox modal renders (conditional)
    ↓
Dark overlay: black 75% opacity
    ↓
White box with:
  ├─ Full-resolution image (width: 100%)
  ├─ Close button (top-right)
  ├─ Image info panel:
  │  ├─ Filename
  │  ├─ File size in KB
  │  └─ Download button
  └─ Click events properly handled
```

### Step 4: Close Lightbox
```
Option A: Click X button
  └─ onClick: setSelectedImage(null)
  └─ Modal closes

Option B: Press ESC key
  └─ onKeyDown → check e.key === 'Escape'
  └─ setSelectedImage(null)
  └─ Modal closes

Option C: Click dark background
  └─ onClick on overlay div
  └─ setSelectedImage(null)
  └─ Modal closes
```

---

## 🎨 Component Structure

### Message Display Component
```
<div className="message-bubble">
  <p className="message-text">{content.body}</p>
  
  {/* Attachments Section */}
  <div className="attachments">
    {content.attachments.map((att, idx) => (
      <>
        {att.type?.startsWith('image/') ? (
          /* IMAGE RENDERING */
          <button onClick={() => setSelectedImage(att)}>
            <img src={att.url} alt={att.name} />
          </button>
        ) : (
          /* FILE DOWNLOAD LINK */
          <a href={att.url} target="_blank">
            📎 {att.name}
          </a>
        )}
      </>
    ))}
  </div>
  
  <p className="timestamp">{formatTime(msg.created_at)}</p>
</div>
```

### Lightbox Modal Component
```
{selectedImage && (
  <div className="fixed inset-0 overlay">
    <div className="modal">
      {/* Close Button */}
      <button 
        className="absolute top-right"
        onClick={() => setSelectedImage(null)}
      >
        ✕
      </button>
      
      {/* Full-Resolution Image */}
      <img src={selectedImage.url} className="w-full" />
      
      {/* Image Info Panel */}
      <div className="info-panel">
        <p className="filename">{selectedImage.name}</p>
        <p className="size">
          {(selectedImage.size / 1024).toFixed(2)} KB
        </p>
        <a className="download-btn" href={selectedImage.url}>
          ⬇️ Download image
        </a>
      </div>
    </div>
  </div>
)}
```

---

## 🖥️ Layout Examples

### Desktop View (1920px+)
```
┌──────────────────────────────────────────────────────────┐
│ Vendor Inbox Modal (max-w-2xl)                      [X] │
├──────────────────┬──────────────────────────────────────┤
│ Conversations    │ Thread View                          │
│ (25% width)      │ (75% width)                          │
│                  │                                      │
│ ☑ Admin 1        │ Message with thumbnail image        │
│   ☐ Admin 2      │ ┌─────────────────────────────┐    │
│                  │ │    [Image Thumbnail]        │    │
│                  │ │    (max-w-xs = 448px)       │    │
│                  │ │    Rounded corners          │    │
│                  │ └─────────────────────────────┘    │
│                  │ 2:30 PM                            │
│                  │                                    │
│                  │ [Message Input]                    │
└──────────────────┴──────────────────────────────────────┘

When image clicked:
┌─────────────────────────────────────────────────────────┐
│          Lightbox Modal (max-w-3xl, max-h-90vh)    │ X │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              [Full-Resolution Image]                    │
│              (width: 100%, height: auto)                │
│                                                         │
│         ┌──────────────────────────────┐               │
│         │ photo.jpg                    │               │
│         │ 245.63 KB                    │               │
│         │ ⬇️ Download image            │               │
│         └──────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### Tablet View (768px-1024px)
```
┌──────────────────────────────────────┐
│ Inbox Modal (full width - 32px p) │X│
├──────────────────────────────────────┤
│ Conversations / Thread (stacked)    │
│                                      │
│ ☑ Admin 1                            │
│   Last message...                    │
│   1 unread                           │
│                                      │
│ ☐ Admin 2                            │
│   Last message...                    │
│   0 unread                           │
│                                      │
│ [Message Input Area]                │
└──────────────────────────────────────┘
```

### Mobile View (320px-480px)
```
┌────────────────────────┐
│ Inbox Modal       [X]  │
├────────────────────────┤
│ ☑ Admin 1              │
│   preview...           │
│                        │
│ ☐ Admin 2              │
│   preview...           │
│                        │
│ Message Input          │
└────────────────────────┘
```

---

## 📊 State Management

### Component State
```javascript
const [selectedImage, setSelectedImage] = useState(null);

// States:
selectedImage === null    // Lightbox closed
selectedImage === {...}   // Lightbox open with image data
```

### Image Object Structure
```javascript
{
  name: "document.jpg",
  url: "https://s3.amazonaws.com/bucket/path/document.jpg",
  type: "image/jpeg",
  size: 245632              // bytes
}
```

### State Transitions
```
Initial: selectedImage = null
  ↓
User clicks image
  ↓
setSelectedImage(attachmentObject)
  ↓
selectedImage = { name, url, type, size }
  ↓
Component renders lightbox (conditional)
  ↓
User closes (button/ESC/background click)
  ↓
setSelectedImage(null)
  ↓
selectedImage = null
  ↓
Component removes lightbox
```

---

## 🎨 Styling Classes

### Image Thumbnail
```css
/* Inline image in message */
className="max-w-xs rounded-lg cursor-pointer hover:opacity-80 transition"

max-w-xs          /* Max width 448px */
rounded-lg        /* Border radius 8px */
cursor-pointer    /* Pointer cursor on hover */
hover:opacity-80  /* 80% opacity on hover */
transition        /* Smooth transition */
```

### Lightbox Container
```css
/* Full-screen overlay */
className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[999] p-4"

fixed             /* Position fixed */
inset-0           /* Cover full screen */
bg-black          /* Black background */
bg-opacity-75     /* 75% opacity */
flex items-center /* Center vertically */
justify-center    /* Center horizontally */
z-[999]           /* Very high z-index */
p-4               /* 16px padding (mobile) */
```

### Modal Window
```css
/* Modal box */
className="relative bg-white rounded-lg max-w-3xl max-h-[90vh] overflow-auto shadow-2xl"

relative          /* Position relative */
bg-white          /* White background */
rounded-lg        /* Border radius 8px */
max-w-3xl         /* Max width 768px */
max-h-[90vh]      /* Max height 90% viewport */
overflow-auto     /* Scroll if needed */
shadow-2xl        /* Large shadow */
```

### Close Button
```css
/* Close button on modal */
className="absolute top-4 right-4 bg-slate-900 text-white rounded-full p-2 hover:bg-slate-700 transition z-10"

absolute          /* Positioned absolutely */
top-4             /* 16px from top */
right-4           /* 16px from right */
bg-slate-900      /* Dark background */
text-white        /* White text/icon */
rounded-full      /* Fully rounded (circle) */
p-2               /* 8px padding */
hover:bg-slate-700 /* Lighter on hover */
transition        /* Smooth transition */
z-10              /* Above image */
```

### Info Panel
```css
/* Image info section */
className="p-4 border-t border-slate-200 bg-slate-50"

p-4               /* 16px padding */
border-t          /* Top border only */
border-slate-200  /* Light gray border */
bg-slate-50       /* Very light gray background */
```

---

## 🔄 Event Flow Diagram

```
User Interaction          Component State       Rendering
──────────────────────────────────────────────────────────

Click Image Thumbnail
        │
        ↓
onClick event fires
        │
        ↓
setSelectedImage(att)
        │
        ↓                selectedImage = att      
        │                ✓                       
        ├──────────────────────→ Conditional render
        │                        {selectedImage && (...)}
        │                                │
        │                                ↓
        │                        Modal appears
        │
        ├─────────────────────→ Modal renders
                              ├─ Overlay
                              ├─ Image
                              ├─ Close button
                              └─ Info panel


User Closes Modal (any method)
        │
        ├─ Click X button ─────╮
        ├─ Press ESC ──────────┤
        └─ Click background ───╯
                │
                ↓
        setSelectedImage(null)
                │
                ↓          selectedImage = null
                │          ✗
                ├──────────────→ Conditional render
                │                skips modal
                │
                ↓
        Modal disappears
```

---

## 📱 Responsive Behavior

### Desktop (1920px+)
- Two-pane layout (conversations | thread)
- Image thumbnail: max-w-xs (448px)
- Modal: max-w-3xl (768px), centered
- Padding: 32px

### Tablet (768px-1024px)
- Stacked layout
- Full width minus padding
- Modal: responsive width
- Padding: 24px

### Mobile (320px-480px)
- Single pane, full width
- Modal: full width minus padding
- Image thumbnail: fit to screen
- Padding: 16px

---

## ✨ User Experience Enhancements

### Visual Feedback
```
Thumbnail:
├─ Rounded corners (friendly appearance)
├─ Hover opacity change (interactive feedback)
└─ Cursor pointer (indicates clickable)

Modal:
├─ Dark overlay (focus on image)
├─ Shadow on modal (depth perception)
├─ Smooth close button (easy to find)
└─ Info panel (context about image)
```

### Accessibility
```
Keyboard:
├─ ESC key to close modal
└─ TAB to navigate buttons

Screen Readers:
├─ button role on image
├─ alt text on img
├─ title attributes on buttons
└─ Semantic HTML structure

Touch:
├─ Large enough click area (image)
├─ Tap to open modal
└─ Multiple close options
```

---

## 🎯 Common Scenarios

### Scenario 1: View Multiple Images in One Message
```
User sees message with 3 images:
[Image 1] [Image 2] [Image 3]

User clicks Image 2
  ↓
Lightbox shows Image 2 full-resolution
  ↓
User closes and clicks Image 1
  ↓
Lightbox shows Image 1

(Each click shows that specific image)
```

### Scenario 2: Message with Images and Files
```
Message: "Here's everything you need"
├─ [Image Thumbnail]      (clickable)
├─ 📎 document.pdf        (download link)
├─ [Image Thumbnail]      (clickable)
└─ 📎 invoice.xlsx        (download link)

Each image can be clicked independently
Each file downloads when clicked
```

### Scenario 3: Large Image in Message
```
User clicks 5MB image
  ↓
Lightbox opens
  ↓
Full image loads (S3 presigned URL)
  ↓
Image displays at full resolution
  ↓
Info shows "5120.00 KB"
  ↓
User can download or close
```

---

## 🚀 Performance Notes

### Efficient Rendering
- Lightbox only renders when `selectedImage !== null`
- Single state variable (minimal memory)
- No image processing on client
- Direct S3 URL loading

### No Impact On:
- Page load time (images already loaded)
- Initial render (modal not in DOM)
- Memory (one object in state)
- Network (using existing URLs)

---

## 🔒 Security Features

### XSS Prevention
- React escapes all dynamic content
- No HTML in filename/metadata
- Safe event handling

### URL Security
- Only S3 presigned URLs (AWS secured)
- No user-generated URLs
- CORS properly configured

### Event Safety
- Proper event propagation control
- Click handlers scoped correctly
- No unintended triggers

---

**Visual Guide Complete**
