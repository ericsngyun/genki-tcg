'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DollarSign, Trophy, Users, Calendar, FileText, Settings } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { DateTimePicker } from '@/components/ui/date-time-picker';

const eventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters').max(100, 'Event name too long'),
  game: z.enum(['ONE_PIECE_TCG', 'AZUKI_TCG', 'RIFTBOUND']),
  format: z.enum(['CONSTRUCTED', 'DRAFT', 'SEALED', 'PRE_RELEASE', 'SUPER_PRE_RELEASE']),
  startAt: z.date({
    required_error: 'Start date and time are required',
  }).refine((date) => date > new Date(), {
    message: 'Start date must be in the future',
  }),
  maxPlayers: z.string().optional().refine((val) => !val || (parseInt(val) >= 2 && parseInt(val) <= 256), {
    message: 'Max players must be between 2 and 256',
  }),
  entryFeeCents: z.string().optional().refine((val) => !val || parseInt(val) >= 0, {
    message: 'Entry fee cannot be negative',
  }),
  totalPrizeCredits: z.string().optional().refine((val) => !val || parseInt(val) >= 0, {
    message: 'Prize credits cannot be negative',
  }),
  requiresDecklist: z.boolean().default(false),
  description: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      game: 'ONE_PIECE_TCG',
      format: 'CONSTRUCTED',
      startAt: undefined,
      maxPlayers: '',
      entryFeeCents: '',
      totalPrizeCredits: '',
      requiresDecklist: false,
      description: '',
    },
  });

  const { register, handleSubmit, control, formState: { errors } } = form;

  const onSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        startAt: data.startAt,
        maxPlayers: data.maxPlayers ? parseInt(data.maxPlayers) : undefined,
        entryFeeCents: data.entryFeeCents ? parseInt(data.entryFeeCents) : undefined,
        totalPrizeCredits: data.totalPrizeCredits ? parseInt(data.totalPrizeCredits) : undefined,
      };

      const event = await api.createEvent(payload);
      toast.success('Event created successfully');
      router.push(`/dashboard/events/${event.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Create Event</h1>
        <p className="text-white/40 mt-1">
          Schedule and configure a new tournament
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Event Details */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Event Details</h2>
              <p className="text-sm text-white/40">Basic information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Event Name <span className="text-red-400">*</span>
              </label>
              <input
                {...register('name')}
                placeholder="e.g. Weekly Friday Night Locals"
                className={`w-full px-4 py-3 bg-white/[0.02] border rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors ${
                  errors.name ? 'border-red-500/50' : 'border-white/[0.1]'
                }`}
              />
              {errors.name && <p className="text-sm text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Game</label>
                <select
                  {...register('game')}
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-white/20"
                >
                  <option value="ONE_PIECE_TCG">One Piece TCG</option>
                  <option value="AZUKI_TCG">Azuki TCG</option>
                  <option value="RIFTBOUND">Riftbound</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Format</label>
                <select
                  {...register('format')}
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-white/20"
                >
                  <option value="CONSTRUCTED">Constructed</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SEALED">Sealed</option>
                  <option value="PRE_RELEASE">Pre-Release</option>
                  <option value="SUPER_PRE_RELEASE">Super Pre-Release</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Description</label>
              <textarea
                {...register('description')}
                placeholder="Enter event details, rules, and any other important information..."
                rows={4}
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.1] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Schedule & Capacity */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Schedule & Capacity</h2>
              <p className="text-sm text-white/40">When and who can join</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">
                Start Date & Time <span className="text-red-400">*</span>
              </label>
              <Controller
                name="startAt"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pick a date and time"
                    error={!!errors.startAt}
                  />
                )}
              />
              {errors.startAt && <p className="text-sm text-red-400 mt-1">{errors.startAt.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Max Players</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  {...register('maxPlayers')}
                  type="number"
                  placeholder="32"
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/[0.1] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                />
              </div>
              <p className="text-xs text-white/30 mt-1">Leave empty for unlimited</p>
              {errors.maxPlayers && <p className="text-sm text-red-400 mt-1">{errors.maxPlayers.message}</p>}
            </div>
          </div>
        </div>

        {/* Entry & Prizes */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Entry & Prizes</h2>
              <p className="text-sm text-white/40">Set the stakes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Entry Fee (Cents)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  {...register('entryFeeCents')}
                  type="number"
                  placeholder="500"
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/[0.1] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                />
              </div>
              <p className="text-xs text-white/30 mt-1">500 cents = $5.00</p>
              {errors.entryFeeCents && <p className="text-sm text-red-400 mt-1">{errors.entryFeeCents.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Prize Pool (Credits)</label>
              <div className="relative">
                <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  {...register('totalPrizeCredits')}
                  type="number"
                  placeholder="1000"
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.02] border border-white/[0.1] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20"
                />
              </div>
              <p className="text-xs text-white/30 mt-1">Store credits distributed to winners</p>
              {errors.totalPrizeCredits && <p className="text-sm text-red-400 mt-1">{errors.totalPrizeCredits.message}</p>}
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Rules & Settings</h2>
              <p className="text-sm text-white/40">Configure event rules</p>
            </div>
          </div>

          <label className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg cursor-pointer hover:bg-white/[0.04] transition-colors">
            <input
              {...register('requiresDecklist')}
              type="checkbox"
              className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0"
            />
            <div>
              <span className="font-medium text-white">Require Decklist Submission</span>
              <p className="text-sm text-white/40 mt-0.5">
                Players must submit a valid decklist before checking in
              </p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-white/[0.02] border border-white/[0.1] rounded-lg text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
