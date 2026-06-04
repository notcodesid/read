import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

export type ExportHighlightsResult = {
  fileUri: string;
  fileName: string;
  copiedToClipboard: boolean;
  shared: boolean;
};

function safeFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'article';
}

export async function exportHighlightsToFile(
  articleTitle: string,
  markdown: string,
): Promise<ExportHighlightsResult> {
  const fileName = `highlights-${safeFileName(articleTitle)}.md`;
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(markdown);

  await Clipboard.setStringAsync(markdown);

  let shared = false;
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/markdown',
      dialogTitle: `Export — ${articleTitle}`,
      UTI: 'net.daringfireball.markdown',
    });
    shared = true;
  } else if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: fileName, text: markdown });
      shared = true;
    }
  } else {
    await Share.share({ message: markdown, title: articleTitle });
    shared = true;
  }

  return {
    fileUri: file.uri,
    fileName,
    copiedToClipboard: true,
    shared,
  };
}