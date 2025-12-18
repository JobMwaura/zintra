'use client';

import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle, Edit2 } from 'lucide-react';

/**
 * NegotiationQA Component
 * Q&A thread for asking and answering questions during negotiation
 * 
 * Props:
 * - qaItems: array - List of Q&A items
 * - onAddQuestion: function - Callback to add question
 * - onAnswerQuestion: function - Callback to answer question
 * - userRole: string - 'buyer' or 'vendor'
 * - userId: string - Current user's UUID
 * - isSubmitting: boolean - Submitting state
 * - error: string - Error message
 * - disabled: boolean - Whether form is disabled
 */
export default function NegotiationQA({
  qaItems = [],
  onAddQuestion,
  onAnswerQuestion,
  userRole,
  userId,
  isSubmitting = false,
  error = null,
  disabled = false
}) {
  const [question, setQuestion] = useState('');
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [answerText, setAnswerText] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [formError, setFormError] = useState(null);

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitError(null);

    if (!question.trim()) {
      setFormError('Please enter a question');
      return;
    }

    try {
      await onAddQuestion(question.trim());
      setQuestion('');
    } catch (err) {
      setSubmitError(err.message || 'Failed to add question');
    }
  };

  const handleAnswerQuestion = async (qaId, e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitError(null);

    const answer = answerText[qaId];
    if (!answer?.trim()) {
      setFormError('Please enter an answer');
      return;
    }

    try {
      await onAnswerQuestion(qaId, answer.trim());
      setAnswerText(prev => ({
        ...prev,
        [qaId]: ''
      }));
      setExpandedAnswers(prev => ({
        ...prev,
        [qaId]: false
      }));
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit answer');
    }
  };

  const unansweredQuestions = qaItems.filter(qa => !qa.answer);
  const answeredQuestions = qaItems.filter(qa => qa.answer);

  return (
    <div className="space-y-6">
      {/* Add Question Form */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
          <h3 className="text-xl font-bold text-gray-900">Ask a Question</h3>
          <p className="text-sm text-gray-600 mt-1">
            Clarify any doubts about the quote, scope, delivery, or payment terms
          </p>
        </div>

        <form onSubmit={handleAddQuestion} className="p-6 space-y-4">
          {(error || submitError || formError) && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-800 mt-1">{error || submitError || formError}</p>
              </div>
            </div>
          )}

          <textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setFormError(null);
            }}
            disabled={disabled || isSubmitting}
            placeholder="What would you like to know about this quote? Be specific to get better answers..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{question.length} / 500 characters</p>
            <button
              type="submit"
              disabled={disabled || isSubmitting || !question.trim()}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition ${
                disabled || isSubmitting || !question.trim()
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Sending...' : 'Ask Question'}
            </button>
          </div>
        </form>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">
            Questions & Answers
            {qaItems.length > 0 && <span className="text-gray-600 font-normal ml-2">({qaItems.length})</span>}
          </h3>
        </div>

        <div className="divide-y">
          {qaItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 text-sm">No questions yet</p>
            </div>
          ) : (
            <div className="space-y-4 p-6">
              {/* Unanswered Questions */}
              {unansweredQuestions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                      Awaiting Answers ({unansweredQuestions.length})
                    </h4>
                  </div>

                  {unansweredQuestions.map((qa) => (
                    <div key={qa.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                      <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{qa.question}</p>
                            <p className="text-xs text-gray-600 mt-2">
                              Asked {new Date(qa.created_at).toLocaleDateString()} at {new Date(qa.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="inline-block bg-yellow-200 text-yellow-800 text-xs px-2.5 py-1 rounded font-semibold">
                              Awaiting Answer
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Answer Form - Only show if user is other party */}
                      {qa.asked_by !== userId && !qa.answer && (
                        <form onSubmit={(e) => handleAnswerQuestion(qa.id, e)} className="p-4 bg-white space-y-3">
                          <textarea
                            value={answerText[qa.id] || ''}
                            onChange={(e) => setAnswerText(prev => ({
                              ...prev,
                              [qa.id]: e.target.value
                            }))}
                            placeholder="Provide your answer here..."
                            rows={3}
                            maxLength={1000}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                          />
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">{(answerText[qa.id] || '').length} / 1000 characters</p>
                            <button
                              type="submit"
                              disabled={isSubmitting || !answerText[qa.id]?.trim()}
                              className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                                isSubmitting || !answerText[qa.id]?.trim()
                                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                              }`}
                            >
                              Submit Answer
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Answered Questions */}
              {answeredQuestions.length > 0 && (
                <div className="space-y-4 mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                      Answered ({answeredQuestions.length})
                    </h4>
                  </div>

                  {answeredQuestions.map((qa) => (
                    <div key={qa.id} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedAnswers(prev => ({
                          ...prev,
                          [qa.id]: !prev[qa.id]
                        }))}
                        className="w-full p-4 flex items-center justify-between bg-green-50 hover:bg-green-100 transition text-left"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{qa.question}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Asked {new Date(qa.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <CheckCircle className={`w-5 h-5 text-green-600 flex-shrink-0 transition ${expandedAnswers[qa.id] ? 'rotate-0' : ''}`} />
                      </button>

                      {expandedAnswers[qa.id] && (
                        <div className="p-4 bg-white border-t border-green-200 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Answer</p>
                            <p className="text-gray-900">{qa.answer}</p>
                          </div>
                          {qa.answered_at && (
                            <div className="text-xs text-gray-600">
                              Answered {new Date(qa.answered_at).toLocaleDateString()} at {new Date(qa.answered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
