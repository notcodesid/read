import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HomeArticleCarousel } from '@/components/home/home-article-carousel';
import { continueReadingSubtitle, hasResumePosition } from '@/lib/continue-reading';
import { readLaterSubtitle } from '@/lib/bookmarks-core';
import { ReadingLayout, ReadingTypography } from '@/constants/reading';
import type { ReadLaterItem } from '@/types/bookmark';
import type { ContinueReadingItem } from '@/types/continue-reading';
import type { ForYouItem } from '@/types/recommendation';

type HomePersonalSectionProps = {
  dailyPickArticleId?: string;
  continueReading: ContinueReadingItem[];
  readLater: ReadLaterItem[];
  forYou: ForYouItem[];
  textColor: string;
  metaColor: string;
  borderColor: string;
  surfaceColor: string;
  onArticlePress: (articleId: string) => void;
  onRemoveFromReadLater?: (articleId: string) => void;
};

function PersonalSubsection({
  label,
  children,
  metaColor,
}: {
  label: string;
  children: ReactNode;
  metaColor: string;
}) {
  return (
    <View style={styles.subsection}>
      <Text style={[styles.subsectionLabel, { color: metaColor }]}>{label}</Text>
      {children}
    </View>
  );
}

export function HomePersonalSection({
  dailyPickArticleId,
  continueReading,
  readLater,
  forYou,
  textColor,
  metaColor,
  borderColor,
  surfaceColor,
  onArticlePress,
  onRemoveFromReadLater,
}: HomePersonalSectionProps) {
  const takenIds = new Set<string>();
  if (dailyPickArticleId) {
    takenIds.add(dailyPickArticleId);
  }

  const continueCards = [...continueReading]
    .sort((a, b) => {
      const aResume = hasResumePosition(a.offsetY) ? 1 : 0;
      const bResume = hasResumePosition(b.offsetY) ? 1 : 0;
      return bResume - aResume;
    })
    .map((item) => {
      takenIds.add(item.articleId);
      return {
        articleId: item.articleId,
        title: item.title,
        authorName: item.authorName,
        subtitle: continueReadingSubtitle(item.offsetY),
      };
    });

  const readLaterCards = readLater
    .filter((item) => !takenIds.has(item.articleId))
    .map((item) => {
      takenIds.add(item.articleId);
      return {
        articleId: item.articleId,
        title: item.title,
        authorName: item.authorName,
        subtitle: readLaterSubtitle(item),
      };
    });

  const forYouCards = forYou
    .filter((item) => !takenIds.has(item.articleId))
    .slice(0, 6)
    .map((item) => ({
      articleId: item.articleId,
      title: item.title,
      authorName: item.authorName,
      subtitle: item.reasonLabel,
    }));

  const hasPersonal =
    continueCards.length > 0 || readLaterCards.length > 0 || forYouCards.length > 0;

  if (!hasPersonal) {
    return null;
  }

  const carouselProps = {
    textColor,
    metaColor,
    borderColor,
    surfaceColor,
    onArticlePress,
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Your reading</Text>

      {continueCards.length > 0 ? (
        <PersonalSubsection label="Continue" metaColor={metaColor}>
          <HomeArticleCarousel
            items={continueCards}
            accessibilityVerb="Continue"
            {...carouselProps}
          />
        </PersonalSubsection>
      ) : null}

      {readLaterCards.length > 0 ? (
        <PersonalSubsection label="Read later" metaColor={metaColor}>
          <HomeArticleCarousel
            items={readLaterCards}
            accessibilityVerb="Open saved"
            onItemLongPress={onRemoveFromReadLater}
            {...carouselProps}
          />
        </PersonalSubsection>
      ) : null}

      {forYouCards.length > 0 ? (
        <PersonalSubsection label="For you" metaColor={metaColor}>
          <Text style={[styles.subsectionHint, { color: metaColor }]}>
            Updates when you return home
          </Text>
          <HomeArticleCarousel
            items={forYouCards}
            accessibilityVerb="Open recommended"
            {...carouselProps}
          />
        </PersonalSubsection>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    gap: 14,
  },
  sectionTitle: {
    fontFamily: ReadingTypography.serif,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
    paddingHorizontal: ReadingLayout.insetX,
  },
  subsection: {
    gap: 8,
  },
  subsectionLabel: {
    ...ReadingTypography.meta,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    paddingHorizontal: ReadingLayout.insetX,
  },
  subsectionHint: {
    ...ReadingTypography.meta,
    fontSize: 10,
    fontStyle: 'italic',
    paddingHorizontal: ReadingLayout.insetX,
    marginTop: -4,
    marginBottom: 2,
  },
});