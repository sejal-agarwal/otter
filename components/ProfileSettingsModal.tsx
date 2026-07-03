'use client'

import React from 'react'

interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  modalNameInput: string
  setModalNameInput: (val: string) => void
  currentGroupName: string | null
  isModalSaving: boolean
  onUpdateProfileSettings: (e: React.FormEvent) => Promise<void>
  onLeaveGroupFromModal: () => Promise<void>
}

export function ProfileSettingsModal({
  isOpen,
  onClose,
  userName,
  modalNameInput,
  setModalNameInput,
  currentGroupName,
  isModalSaving,
  onUpdateProfileSettings,
  onLeaveGroupFromModal,
}: ProfileSettingsModalProps) {
  if (!isOpen) return null

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4 animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-jade-accent text-white rounded-[2.5rem] p-8 border border-jade-accent shadow-2xl flex flex-col w-full max-w-md transition duration-200"
      >
        <div className="space-y-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white select-none">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-wide text-white select-none">Profile Settings</h2>
                <p className="text-[11px] text-pebble-light opacity-80 font-medium select-none">Modify your identity metadata preferences.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              disabled={isModalSaving}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Name Field Form Context */}
          <form onSubmit={onUpdateProfileSettings} className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-pebble-light/80 pl-0.5">Your Name</label>
              <input 
                type="text"
                maxLength={40}
                required
                value={modalNameInput}
                onChange={(e) => setModalNameInput(e.target.value)}
                disabled={isModalSaving}
                className="w-full bg-pebble-light text-sm text-forest-dark font-medium rounded-xl px-4 py-3 outline-none border border-white/10 shadow-inner transition focus:bg-white disabled:opacity-50"
              />
            </div>

            {/* Save Action Rows situated immediately under the input target */}
            <div className="flex items-center justify-end gap-2.5 pb-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isModalSaving}
                className="text-xs font-bold bg-white/10 text-white border border-white/10 px-4 py-2.5 rounded-xl hover:bg-white/20 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!modalNameInput.trim() || modalNameInput.trim() === userName || isModalSaving}
                className="text-xs font-bold bg-forest-dark text-white disabled:opacity-30 px-4 py-2.5 rounded-xl hover:bg-forest-dark/90 transition shadow-sm cursor-pointer"
              >
                {isModalSaving ? 'Saving...' : 'Save Name'}
              </button>
            </div>
          </form>

          {/* Group Status Segment situated safely at the bottom card layout baseline */}
          <div className="border-t border-white/10 pt-5 mt-2">
            <div className="bg-forest-dark/10 border border-white/10 rounded-2xl p-4 flex flex-col space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pebble-light/70 select-none">Current Group Context</span>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-white font-mono truncate select-all">
                  {currentGroupName ? currentGroupName : 'No Group Joined'}
                </span>
                {currentGroupName && (
                  <button
                    type="button"
                    onClick={onLeaveGroupFromModal}
                    disabled={isModalSaving}
                    className="text-xs font-bold text-white bg-red-700/40 hover:bg-red-700 rounded-xl px-4 py-2 border border-red-700/20 transition disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    Leave Group
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}