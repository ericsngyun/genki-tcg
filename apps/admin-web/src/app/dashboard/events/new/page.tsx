'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DollarSign, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/date-time-picker';

// --- Schema Definition ---

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
        startAt: data.startAt, // Already a Date object
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Event</h1>
        <p className="text-muted-foreground mt-2">
          Schedule and configure a new tournament for your community.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Basic information about the tournament.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                placeholder="e.g. Weekly Friday Night Locals"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="game">Game System</Label>
                <Select id="game" {...register('game')}>
                  <option value="ONE_PIECE_TCG">One Piece TCG</option>
                  <option value="AZUKI_TCG">Azuki TCG</option>
                  <option value="RIFTBOUND">Riftbound</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select id="format" {...register('format')}>
                  <option value="CONSTRUCTED">Constructed</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SEALED">Sealed</option>
                  <option value="PRE_RELEASE">Pre-Release</option>
                  <option value="SUPER_PRE_RELEASE">Super Pre-Release</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter event details, rules, and any other important information..."
                className="h-32"
                {...register('description')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Capacity Card */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule & Capacity</CardTitle>
            <CardDescription>When is it happening and who can join?</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startAt">Start Date & Time <span className="text-destructive">*</span></Label>
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
              {errors.startAt && <p className="text-sm text-destructive">{errors.startAt.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Max Players</Label>
              <div className="relative">
                <Input
                  id="maxPlayers"
                  type="number"
                  placeholder="32"
                  {...register('maxPlayers')}
                  className="pl-10"
                />
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Leave empty for unlimited cap.</p>
              {errors.maxPlayers && <p className="text-sm text-destructive">{errors.maxPlayers.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Financials Card */}
        <Card>
          <CardHeader>
            <CardTitle>Entry & Prizes</CardTitle>
            <CardDescription>Set the stakes for the tournament.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="entryFeeCents">Entry Fee (Cents)</Label>
              <div className="relative">
                <Input
                  id="entryFeeCents"
                  type="number"
                  placeholder="500"
                  {...register('entryFeeCents')}
                  className="pl-10"
                />
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">500 cents = $5.00</p>
              {errors.entryFeeCents && <p className="text-sm text-destructive">{errors.entryFeeCents.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPrizeCredits">Total Prize Pool (Credits)</Label>
              <div className="relative">
                <Input
                  id="totalPrizeCredits"
                  type="number"
                  placeholder="1000"
                  {...register('totalPrizeCredits')}
                  className="pl-10"
                />
                <Trophy className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Store credits distributed independently of entry fees.</p>
              {errors.totalPrizeCredits && <p className="text-sm text-destructive">{errors.totalPrizeCredits.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Rules Card */}
        <Card>
          <CardHeader>
            <CardTitle>Rules & Regulations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 rounded-md border p-4 bg-muted/20">
              <input
                id="requiresDecklist"
                type="checkbox"
                {...register('requiresDecklist')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="space-y-1">
                <Label htmlFor="requiresDecklist" className="text-base font-medium">Require Decklist Submission</Label>
                <p className="text-sm text-muted-foreground">
                  Players must submit a valid decklist before checking in.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">•</span> Creating...
              </>
            ) : (
              'Create Event'
            )}
          </Button>
        </div>

      </form>
    </div>
  );
}
