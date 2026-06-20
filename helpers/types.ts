/**
 * Représente un morceau retourné par l'API Deezer.
 * @see https://developers.deezer.com/api/track
 */
export interface Track {
  /** Identifiant unique du morceau. */
  id: number;
  /** Titre du morceau. */
  title: string;
  /** Durée du morceau en secondes. */
  duration: number;
  /** Score de popularité du morceau. */
  rank?: number;
  /** URL de l'extrait audio de 30 secondes (absent si aucun extrait n'est disponible). */
  preview?: string;
  /** Artiste associé au morceau (objet simplifié selon le contexte). */
  artist: Artist;
  /** Album associé au morceau (objet simplifié selon le contexte). */
  album: Album;
}

/**
 * Représente un artiste retourné par l'API Deezer.
 * @see https://developers.deezer.com/api/artist
 */
export interface Artist {
  /** Identifiant unique de l'artiste. */
  id: number;
  /** Nom de l'artiste. */
  name: string;
  /** URL de l'image de profil de l'artiste. */
  picture?: string;
  /** URL de la miniature de l'image de profil (56×56 px). */
  picture_small?: string;
  /** URL de l'image de profil moyenne (250×250 px). */
  picture_medium?: string;
  /** Nombre d'albums de l'artiste (présent uniquement sur l'objet artiste complet). */
  nb_album?: number;
  /** Nombre de fans de l'artiste (présent uniquement sur l'objet artiste complet). */
  nb_fan?: number;
}

/**
 * Représente un album retourné par l'API Deezer.
 * @see https://developers.deezer.com/api/album
 */
export interface Album {
  /** Identifiant unique de l'album. */
  id: number;
  /** Titre de l'album. */
  title: string;
  /** URL de la pochette de l'album. */
  cover?: string;
  /** URL de la miniature de la pochette (56×56 px). */
  cover_small?: string;
  /** URL de la pochette moyenne (250×250 px). */
  cover_medium?: string;
  /** Date de sortie au format AAAA-MM-JJ (présente uniquement sur l'objet album complet). */
  release_date?: string;
  /** Nombre de morceaux de l'album (présent uniquement sur l'objet album complet). */
  nb_tracks?: number;
  /** Liste des tracks de l'album. */
  tracks: {
    data: Track[];
  };
}

/**
 * Réponse détaillée d'un morceau Deezer.
 */
export interface DeezerTrackDetail extends Track {
  release_date: string;
}

/**
 * Réponse paginée d'une recherche Deezer.
 * @see https://developers.deezer.com/api/search
 */
export interface SearchResponse {
  /** Liste des morceaux correspondant à la recherche. */
  data: Track[];
  /** Nombre total de résultats disponibles. */
  total: number;
  /** URL de la page suivante (absente s'il n'y a plus de résultats). */
  next?: string;
  /** URL de la page précédente (absente sur la première page). */
  prev?: string;
}

/** 
 * Réponse avec une erreur de l'api.
 */
export interface DeezerError {
  error: {
    type: string;
    message: string;
    code: number;
  };
}