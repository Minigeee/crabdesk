export const getGradeColor = (score: number) => {
  switch (score) {
    case 1:
      return 'text-destructive';
    case 2:
      return 'text-orange-500';
    case 3:
      return 'text-yellow-500';
    case 4:
      return 'text-green-500';
    case 5:
      return 'text-blue-500';
    default:
      return 'text-muted-foreground';
  }
};

export const getGradeLabel = (score: number) => {
  switch (score) {
    case 1:
      return 'Bad';
    case 2:
      return 'Poor';
    case 3:
      return 'Acceptable';
    case 4:
      return 'Good';
    case 5:
      return 'Great';
    default:
      return 'Unknown';
  }
};

export const shouldShowDraft = (draft: { status: string }) => {
  return draft.status === 'pending' || draft.status === 'rejected';
};

export interface Placeholder {
  text: string;
  start: number;
  end: number;
}

export const findPlaceholders = (text: string): Placeholder[] => {
  const placeholders: Placeholder[] = [];
  const regex = /\[([^\]]+)\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    placeholders.push({
      text: match[1],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Sort placeholders by position in reverse order
  // This ensures we replace from end to start to maintain correct indices
  return placeholders.sort((a, b) => b.start - a.start);
};

export const replacePlaceholder = (
  text: string,
  placeholder: Placeholder,
  value: string
): string => {
  return (
    text.substring(0, placeholder.start) +
    value +
    text.substring(placeholder.end)
  );
};

export const replacePlaceholders = (
  text: string,
  replacements: Record<string, string>
): string => {
  let result = text;
  // findPlaceholders now returns placeholders sorted from end to start
  const placeholders = findPlaceholders(result);

  // Process placeholders from end to start to maintain correct indices
  for (const placeholder of placeholders) {
    if (replacements[placeholder.text]) {
      result = replacePlaceholder(result, placeholder, replacements[placeholder.text]);
    }
  }

  return result;
}; 