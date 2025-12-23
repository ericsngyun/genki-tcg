'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DollarSign, Users, Calendar, FileText, Settings, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

import { api } from '@/lib/api';
import { DateTimePicker } from '@/components/ui/date-time-picker';

// Game configuration with images and colors
const GAMES = [
  {
    id: 'ONE_PIECE_TCG',
    name: 'One Piece TCG',
    shortName: 'One Piece',
    image: '/optcg.jpg',
    color: '#DC2626',
    gradient: 'from-red-600 to-red-800',
  },
  {
    id: 'AZUKI_TCG',
    name: 'Azuki TCG',
    shortName: 'Azuki',
    image: '/azukitcg.jpg',
    color: '#8B5CF6',
    gradient: 'from-violet-600 to-violet-800',
  },
  {
    id: 'RIFTBOUND',
    name: 'Riftbound',
    shortName: 'Riftbound',
    image: '/riftboundtcg.jpg',
    color: '#3B82F6',
    gradient: 'from-blue-600 to-blue-800',
  },
] as const;

// Format configuration
const FORMATS = [
  { id: 'CONSTRUCTED', name: 'Constructed', description: 'Build your own deck' },
  { id: 'DRAFT', name: 'Draft', description: 'Draft cards from packs' },
  { id: 'SEALED', name: 'Sealed', description: 'Build from sealed packs' },
  { id: 'PRE_RELEASE', name: 'Pre-Release', description: 'New set preview event' },
  { id: 'SUPER_PRE_RELEASE', name: 'Super Pre-Release', description: 'Premium preview event' },
] as const;

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
  entryFee: z.string().optional().refine((val) => !val || parseFloat(val) >= 0, {
    message: 'Entry fee cannot be negative',
  }),
  requiresDecklist: z.boolean().default(false),
  description: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      game: 'ONE_PIECE_TCG',
      format: 'CONSTRUCTED',
      startAt: undefined,
      maxPlayers: '',
      entryFee: '',
      requiresDecklist: false,
      description: '',
    },
  });

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = form;
  const selectedGame = watch('game');
  const selectedFormat = watch('format');

  const currentGame = GAMES.find(g => g.id === selectedGame) || GAMES[0];
  const currentFormat = FORMATS.find(f => f.id === selectedFormat) || FORMATS[0];

  const onSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true);
    try {
      // Convert dollars to cents for the API
      const entryFeeCents = data.entryFee ? Math.round(parseFloat(data.entryFee) * 100) : undefined;

      const payload = {
        name: data.name,
        game: data.game,
        format: data.format,
        startAt: data.startAt,
        maxPlayers: data.maxPlayers ? parseInt(data.maxPlayers) : undefined,
        entryFeeCents,
        requiresDecklist: data.requiresDecklist,
        description: data.description,
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
        {/* Game Selector */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-xl">🎮</span>
            </div>
            <div>
              <h2 className="font-semibold text-white">Select Game</h2>
              <p className="text-sm text-white/40">Choose which TCG this event is for</p>
            </div>
          </div>

          <Controller
            name="game"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-3">
                {GAMES.map((game) => {
                  const isSelected = field.value === game.id;
                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => field.onChange(game.id)}
                      className={`relative group overflow-hidden rounded-xl transition-all duration-300 ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-offset-[#0a0a0f] scale-[1.02]'
                          : 'hover:scale-[1.01] opacity-60 hover:opacity-90'
                      }`}
                      style={{
                        ['--ring-color' as string]: game.color,
                        ringColor: isSelected ? game.color : undefined
                      }}
                    >
                      {/* Game Image */}
                      <div className="aspect-[4/3] relative">
                        <Image
                          src={game.image}
                          alt={game.name}
                          fill
                          className="object-cover"
                        />
                        {/* Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent`} />

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div
                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: game.color }}
                          >
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        {/* Game Name */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="font-semibold text-white text-sm">{game.shortName}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

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

            {/* Format Selector */}
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Format</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                  className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.1] rounded-lg text-white text-left focus:outline-none focus:border-white/20 flex items-center justify-between hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: currentGame.color }}
                    />
                    <div>
                      <span className="font-medium">{currentFormat.name}</span>
                      <span className="text-white/40 text-sm ml-2">— {currentFormat.description}</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showFormatDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showFormatDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowFormatDropdown(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a24] border border-white/[0.1] rounded-lg overflow-hidden z-20 shadow-xl">
                      {FORMATS.map((format) => {
                        const isSelected = selectedFormat === format.id;
                        return (
                          <button
                            key={format.id}
                            type="button"
                            onClick={() => {
                              setValue('format', format.id);
                              setShowFormatDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                              isSelected
                                ? 'bg-white/[0.08]'
                                : 'hover:bg-white/[0.04]'
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full transition-colors ${isSelected ? '' : 'opacity-30'}`}
                              style={{ backgroundColor: currentGame.color }}
                            />
                            <div className="flex-1">
                              <span className={`font-medium ${isSelected ? 'text-white' : 'text-white/70'}`}>
                                {format.name}
                              </span>
                              <span className="text-white/40 text-sm ml-2">— {format.description}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-white/60" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
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

        {/* Entry Fee */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Entry Fee</h2>
              <p className="text-sm text-white/40">Cost to participate</p>
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-sm font-medium text-white/60 mb-2">Entry Fee (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-medium">$</span>
              <input
                {...register('entryFee')}
                type="number"
                step="0.01"
                min="0"
                placeholder="5.00"
                className="w-full pl-8 pr-4 py-3 bg-white/[0.02] border border-white/[0.1] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20"
              />
            </div>
            <p className="text-xs text-white/30 mt-1">Leave empty for free entry</p>
            {errors.entryFee && <p className="text-sm text-red-400 mt-1">{errors.entryFee.message}</p>}
          </div>
        </div>

        {/* Rules */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-violet-400" />
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
