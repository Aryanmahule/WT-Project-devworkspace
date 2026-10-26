import React, { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  Trash2,
  FileText,
  FileCode,
  Image as ImageIcon
} from 'lucide-react';
import { FileRecord } from '../../types';
import { api } from '../../services/api';

export const FilesView: React.FC = () => {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const res = await api.getFiles();
      setFiles(res.files || []);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      setFiles([res.file, ...files]);
    } catch (err: any) {
      alert(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('apex_token')}`,
        },
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || ''))
      return <ImageIcon size={18} className="text-accent" />;
    if (['py', 'ts', 'js', 'json', 'html', 'css'].includes(ext || ''))
      return <FileCode size={18} className="text-accent" />;
    return <FileText size={18} className="text-text-muted" />;
  };

  return (
    <div className="max-w-content mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page-title text-text-main font-semibold">
            Files & Document Storage
          </h1>
          <p className="text-secondary text-text-muted mt-1">
            Central repository for team specifications, diagrams, deployment manifests, and archives
          </p>
        </div>

        <label className="btn-accent cursor-pointer self-start sm:self-auto">
          <Upload size={16} />
          <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
          <input
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Files Table Card */}
      <div className="ui-card p-0 overflow-hidden">
        <table className="w-full text-left text-body border-collapse">
          <thead>
            <tr className="border-b border-border bg-page text-[12px] font-semibold text-text-muted uppercase tracking-wider">
              <th className="py-3 px-6">Name</th>
              <th className="py-3 px-6">Size</th>
              <th className="py-3 px-6">Uploader</th>
              <th className="py-3 px-6">Uploaded At</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {files.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 px-6 text-center text-secondary text-text-muted">
                  No files uploaded yet. Click "Upload File" above to add documents.
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr
                  key={file.id}
                  className="hover:bg-page/50 transition-colors"
                >
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.original_name)}
                      <span className="font-medium text-text-main">
                        {file.original_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 text-secondary text-text-muted">
                    {formatBytes(file.file_size)}
                  </td>
                  <td className="py-3.5 px-6 text-secondary text-text-muted">
                    {file.uploader?.full_name || 'System'}
                  </td>
                  <td className="py-3.5 px-6 text-secondary text-text-muted">
                    {file.created_at ? new Date(file.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/api/files/${file.id}/download`}
                        className="btn-outlined btn-sm p-1.5"
                        download
                        title="Download"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="btn-danger btn-sm p-1.5"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
