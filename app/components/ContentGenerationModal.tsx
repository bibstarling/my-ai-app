'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { FileText, Mail, Loader2, Sparkles } from 'lucide-react';

interface ContentGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  onGenerate: (contentTypes: { resume: boolean; coverLetter: boolean }) => Promise<void>;
}

export function ContentGenerationModal({
  isOpen,
  onClose,
  jobTitle,
  companyName,
  onGenerate,
}: ContentGenerationModalProps) {
  const [selectedTypes, setSelectedTypes] = useState({
    resume: true,
    coverLetter: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedTypes.resume && !selectedTypes.coverLetter) {
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate(selectedTypes);
      onClose();
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Generate Tailored Content"
      variant="info"
      icon={<Sparkles className="w-6 h-6" />}
      footer={
        <div className="flex gap-3 w-full">
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!selectedTypes.resume && !selectedTypes.coverLetter)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Job Info */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-1">{jobTitle}</h4>
          <p className="text-sm text-blue-700">{companyName}</p>
        </div>

        {/* Content Type Selection */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-900">
            Select content to generate:
          </p>

          {/* Resume Option */}
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={selectedTypes.resume}
              onChange={(e) =>
                setSelectedTypes({ ...selectedTypes, resume: e.target.checked })
              }
              className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Tailored Resume</span>
              </div>
              <p className="text-sm text-gray-600">
                AI-optimized resume highlighting your most relevant experience and skills for this specific role.
              </p>
            </div>
          </label>

          {/* Cover Letter Option */}
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={selectedTypes.coverLetter}
              onChange={(e) =>
                setSelectedTypes({ ...selectedTypes, coverLetter: e.target.checked })
              }
              className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              disabled={isGenerating}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">Cover Letter</span>
              </div>
              <p className="text-sm text-gray-600">
                Personalized cover letter that connects your experience to this company's needs.
              </p>
            </div>
          </label>
        </div>

        {/* Generation Time Estimate */}
        {(selectedTypes.resume || selectedTypes.coverLetter) && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
            <span className="font-medium">Estimated time:</span>{' '}
            {selectedTypes.resume && selectedTypes.coverLetter
              ? '60-90 seconds'
              : '30-45 seconds'}
          </div>
        )}
      </div>
    </Modal>
  );
}
