import { Dialog } from '@headlessui/react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const ConfirmationDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isProcessing = false
}: ConfirmationDialogProps) => (
  <Dialog open={isOpen} onClose={onCancel} className="fixed inset-0 z-10 overflow-y-auto">
    <div className="min-h-screen px-4 text-center">
      <div className="fixed inset-0 bg-black opacity-30" />

      <div className="inline-block align-middle my-16 p-6 bg-white rounded-xl shadow-xl max-w-md w-full">
        <Dialog.Title className="text-lg font-bold mb-4">{title}</Dialog.Title>
        <Dialog.Description className="mb-6">{message}</Dialog.Description>
        
        <div className="flex gap-4 justify-end">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  </Dialog>
);

export default ConfirmationDialog;