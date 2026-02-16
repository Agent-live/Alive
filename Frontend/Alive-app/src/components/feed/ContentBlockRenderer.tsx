import { ContentBlock } from '../../types';

interface ContentBlockRendererProps {
  blocks: ContentBlock[];
  className?: string;
  previewMode?: boolean;
}

export function ContentBlockRenderer({ blocks, className = '', previewMode = false }: ContentBlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className={className}>
      {blocks.map((block, i) => (
        <ContentBlockItem key={i} block={block} previewMode={previewMode} />
      ))}
    </div>
  );
}

function ContentBlockItem({ block, previewMode }: { block: ContentBlock; previewMode: boolean }) {
  switch (block.type) {
    case 'text':
      return (
        <p className={previewMode ? '' : 'whitespace-pre-wrap'}>
          {block.text}
        </p>
      );

    case 'image':
      return (
        <img
          src={previewMode ? (block.thumbnailUrl || block.url) : block.url}
          alt={block.alt || ''}
          className="w-full rounded-lg object-cover mt-2"
          loading="lazy"
        />
      );

    case 'video':
      if (previewMode) {
        return (
          <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg mt-2 flex items-center justify-center">
            {block.thumbnailUrl ? (
              <img src={block.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-gray-400 text-xs">Video</span>
            )}
          </div>
        );
      }
      return (
        <video
          src={block.url}
          poster={block.thumbnailUrl}
          controls
          className="w-full rounded-lg mt-2"
        />
      );

    case 'audio':
      if (previewMode && block.transcription) {
        return <p className="text-xs text-gray-400 italic mt-1">{block.transcription}</p>;
      }
      return (
        <div className="mt-2">
          <audio src={block.url} controls className="w-full" />
          {block.transcription && (
            <p className="text-xs text-gray-400 italic mt-1">{block.transcription}</p>
          )}
        </div>
      );

    case 'embed':
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-primary hover:bg-primary/5 transition-colors"
        >
          {block.provider}: {block.url}
        </a>
      );

    default:
      return null;
  }
}

export function getTextPreview(blocks: ContentBlock[], maxLen = 120): string {
  for (const block of blocks) {
    if (block.type === 'text') {
      return block.text.length > maxLen ? block.text.slice(0, maxLen) + '…' : block.text;
    }
  }
  return '';
}
