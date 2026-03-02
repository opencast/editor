import { Catalog } from "./redux/metadataSlice";

export interface Segment {
  id: string,
  start: number,
  end: number,
  deleted: boolean,
  text?: string, // For chapters
}

export interface Track {
  id: string,
  uri: string,
  flavor: Flavor,
  audio_stream: {available: boolean, enabled: boolean, thumbnail_uri: string},
  video_stream: {available: boolean, enabled: boolean, thumbnail_uri: string},
  thumbnailUri: string | undefined,
  thumbnailPriority: number,
}

export interface Flavor {
  type: string,
  subtype: string,
}

export interface Workflow {
  id: string,
  name: string,
  description: string,
  displayOrder: number,
}

export interface TimelineState {
  segments: Segment[]
  scrubberPos: number
}

export interface SubtitlesFromOpencast {
  id: string,
  subtitle: string,
  tags: string[],
}

export interface SubtitlesInEditor {
  cues: SubtitleCue[],
  tags: string[],
  deleted: boolean,
}

export interface SubtitleCue {
  id?: string,              // Actually not useful as an identifier, as it is not guaranteed to exist
  idInternal: string,       // Identifier for internal use. Has nothing to do with the webvtt parser.
  text: string,
  startTime: number,
  endTime: number,
  // Odditiy of the webvtt parser. Changes to text also need to be applied to tree.children[0].value
  tree: {children: [{type: string, value: string}]}
  // And many more
}

export interface ExtendedSubtitleCue extends SubtitleCue {
  alignment : string
  direction : string
  lineAlign : string
  linePosition : string
  positionAlign : string
  size : number
  textPosition : string
}

export interface CommentReply {
  id: number | string;
  creationDate: string;
  author: string;  // username of the author
  text: string;
  pending?: boolean;  // UI-only: true if not yet saved to backend
}

export interface Comment {
  id: number | string;
  creationDate: string;
  author: string;  // username of the author
  reason: string;
  text: string;
  resolvedStatus: boolean;
  replies: CommentReply[];
  pending?: boolean;  // UI-only: true if not yet saved to backend
}

export interface PostEditArgument {
  segments: Segment[]
  tracks: Track[]
  customizedTrackSelection: boolean
  subtitles: SubtitlesFromOpencast[]
  chapters: SubtitlesFromOpencast[]
  workflow?: [{id: string}]
  metadata: Catalog[]
  comments: Comment[]
}

// Use respective i18n keys as values
export enum MainMenuStateNames {
  cutting = "mainMenu.cutting-button",
  metadata = "mainMenu.metadata-button",
  trackSelection = "mainMenu.select-tracks-button",
  subtitles = "mainMenu.subtitles-button",
  chapters = "mainMenu.chapters-button",
  thumbnail = "mainMenu.thumbnail-button",
  comments = "mainMenu.comments-button",
  finish = "mainMenu.finish-button",
  keyboardControls = "mainMenu.keyboard-controls-button",
}

export interface httpRequestState {
  status: "idle" | "loading" | "success" | "failed",
  error: string | undefined,
  errorReason: "unknown" | "workflowActive"
}
