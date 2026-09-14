import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CollegeSubject } from '../App';

interface EditSubjectDialogProps {
  subject: CollegeSubject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedSubject: CollegeSubject) => void;
}

export function EditSubjectDialog({
  subject,
  open,
  onOpenChange,
  onSave,
}: EditSubjectDialogProps) {
  const [name, setName] = useState('');
  const [totalClasses, setTotalClasses] = useState('');
  const [attendedClasses, setAttendedClasses] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setTotalClasses(subject.totalClasses.toString());
      setAttendedClasses(subject.attendedClasses.toString());
      setError(null);
    }
  }, [subject, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Subject name cannot be empty.');
      return;
    }

    const total = parseInt(totalClasses, 10);
    const attended = parseInt(attendedClasses, 10);

    if (isNaN(total) || total < 0) {
      setError('Please enter a valid number of total classes.');
      return;
    }

    if (isNaN(attended) || attended < 0) {
      setError('Please enter a valid number of attended classes.');
      return;
    }

    if (attended > total) {
      setError('Attended classes cannot exceed total classes.');
      return;
    }

    onSave({
      ...subject,
      name: trimmedName,
      totalClasses: total,
      attendedClasses: attended,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Modify the subject name or attendance numbers below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="editSubjectName">Subject Name</Label>
            <Input
              id="editSubjectName"
              placeholder="e.g., Mathematics"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editTotalClasses">Total Classes</Label>
            <Input
              id="editTotalClasses"
              type="number"
              min="0"
              placeholder="e.g., 20"
              value={totalClasses}
              onChange={(e) => {
                setTotalClasses(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editAttendedClasses">Attended Classes</Label>
            <Input
              id="editAttendedClasses"
              type="number"
              min="0"
              placeholder="e.g., 15"
              value={attendedClasses}
              onChange={(e) => {
                setAttendedClasses(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
