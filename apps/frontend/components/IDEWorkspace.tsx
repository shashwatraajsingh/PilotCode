'use client'

import { useState } from 'react'
import { FileCode, Terminal, GitBranch, Play, CheckCircle2, XCircle, Loader2, FolderTree } from 'lucide-react'

interface FileChange {
  path: string
  status: 'modified' | 'created' | 'deleted'
  diff?: string
}

interface IDEWorkspaceProps {
  taskId: string
  files: FileChange[]
  currentFile?: string
  logs: Array<{ timestamp: string; message: string; type: 'info' | 'error' | 'success' }>
  status: 'idle' | 'running' | 'success' | 'error'
}

export function IDEWorkspace({ taskId, files, currentFile, logs, status }: IDEWorkspaceProps) {
  const [selectedFile, setSelectedFile] = useState<string>(currentFile || files[0]?.path || '')
  const [activeTab, setActiveTab] = useState<'code' | 'terminal' | 'changes'>('code')

  const selectedFileData = files.find(f => f.path === selectedFile)

  const statusConfig = {
    idle: { icon: FileCode, color: 'text-gray-600', bg: 'bg-gray-100', spin: false },
    running: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', spin: true },
    success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', spin: false },
    error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', spin: false },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${config.bg} p-2 rounded-lg`}>
            <StatusIcon className={`w-5 h-5 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Devin's Workspace</h3>
            <p className="text-xs text-gray-600">Task #{taskId.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${config.color}`}>{status.toUpperCase()}</span>
        </div>
      </div>

      <div className="flex h-[600px]">
        {/* Sidebar - File Explorer */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FolderTree className="w-4 h-4" />
              <span>Files Changed ({files.length})</span>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file.path)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedFile === file.path
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{file.path.split('/').pop()}</span>
                </div>
                <div className="ml-6 text-xs text-gray-500">{file.path}</div>
                <div className="ml-6">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      file.status === 'created'
                        ? 'bg-green-100 text-green-700'
                        : file.status === 'modified'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {file.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white">
            <div className="flex">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'code'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  <span>Code</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'terminal'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span>Terminal</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('changes')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'changes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  <span>Changes</span>
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'code' && selectedFileData && (
              <div className="p-4">
                <div className="mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FileCode className="w-4 h-4" />
                    <span className="font-mono">{selectedFile}</span>
                  </div>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                  <code>{selectedFileData.diff || '// Code changes will appear here...'}</code>
                </pre>
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="h-full bg-gray-900 text-gray-100 p-4 font-mono text-sm overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span
                      className={
                        log.type === 'error'
                          ? 'text-red-400'
                          : log.type === 'success'
                          ? 'text-green-400'
                          : 'text-gray-300'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-gray-500">Waiting for execution logs...</div>
                )}
              </div>
            )}

            {activeTab === 'changes' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-900">Git Changes</h4>
                  <span className="text-xs text-gray-600">{files.length} files changed</span>
                </div>
                {files.map((file) => (
                  <div key={file.path} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-gray-600" />
                        <span className="font-mono text-sm text-gray-900">{file.path}</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          file.status === 'created'
                            ? 'bg-green-100 text-green-700'
                            : file.status === 'modified'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {file.status}
                      </span>
                    </div>
                    {file.diff && (
                      <pre className="mt-2 bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto">
                        {file.diff}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
