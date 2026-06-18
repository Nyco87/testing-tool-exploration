import {z} from 'zod';

export const ArtistSchema = z.object({
    id: z.number(),
    name: z.string(),
    picture: z.string().optional(),
    picture_small: z.string().optional(),
    picture_medium: z.string().optional(),
    nb_albums: z.number().optional(),
    nb_fan: z.number().optional(),
})

// AlbumSchema simplifié — sans tracks pour éviter la circularité
export const AlbumSchema = z.object({
    id: z.number(),
    title: z.string(),
    cover: z.string().optional(),
    cover_small: z.string().optional(),
    cover_medium: z.string().optional(),
    release_date: z.string().optional(),
    nb_tracks: z.number().optional(),
});

export const TrackSchema = z.object({
    id: z.number(),
    title: z.string(),
    duration: z.number(),
    rank: z.number(),
    preview: z.string().optional(),
    artist: ArtistSchema,
    album: AlbumSchema,
});

export const AlbumFullSchema = AlbumSchema.extend({
    tracks: z.object({
        data: z.array(TrackSchema),
    }),
})

export const SearchResponseSchema = z.object({
    data: z.array(TrackSchema),
    total: z.number(),
    next: z.string().optional(),
    prev: z.string().optional(),
});