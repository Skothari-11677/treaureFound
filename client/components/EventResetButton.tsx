import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { resetService } from '../lib/resetService';

interface EventResetButtonProps {
  submissionCount: number;
  onResetComplete: () => void;
}

export default function EventResetButton({ submissionCount, onResetComplete }: EventResetButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!password) {
      toast.error('Please enter the admin password');
      return;
    }

    setIsResetting(true);
    
    try {
      const result = await resetService.performCompleteReset(password);
      
      if (result.success) {
        setShowDialog(false);
        setPassword('');
        onResetComplete();
        toast.success('🎉 Event data reset completed! Ready for fresh start.');
      }
    } catch (error) {
      console.error('Reset error:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="destructive"
        size="sm"
        className="font-semibold"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Event Reset ({submissionCount})
      </Button>

      {showDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-card border-2 border-destructive rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                Event Reset
              </h2>
              <div className="bg-destructive/10 border border-destructive/20 rounded p-3 mb-4">
                <p className="text-sm font-medium">
                  This will delete all {submissionCount} submissions
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use this to reset between events or clear test data
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Admin Password Required
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="text-center font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && password && !isResetting) {
                      handleReset();
                    }
                  }}
                  disabled={isResetting}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDialog(false);
                    setPassword('');
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isResetting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReset}
                  variant="destructive"
                  className="flex-1 font-semibold"
                  disabled={!password || isResetting}
                >
                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Event Data'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
