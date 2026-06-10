import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type IosSettingsGroupProps = {
  children: ReactNode;
  footer?: string;
};

export function IosSettingsGroup({ children, footer }: IosSettingsGroupProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.group,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        {children}
      </View>
      {footer ? (
        <Text style={[styles.footer, { color: theme.textSecondary }]}>{footer}</Text>
      ) : null}
    </View>
  );
}

type IosSettingsRowProps = {
  label: string;
  value?: string;
  destructive?: boolean;
  isLast?: boolean;
};

export function IosSettingsRow({
  label,
  value,
  destructive = false,
  isLast = false,
}: IosSettingsRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      <Text
        style={[
          styles.label,
          { color: destructive ? '#FF3B30' : theme.text },
        ]}>
        {label}
      </Text>
      {value ? (
        <Text style={[styles.value, { color: theme.textSecondary }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  group: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  footer: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 16,
    gap: 12,
  },
  label: {
    fontSize: 17,
    flexShrink: 0,
  },
  value: {
    fontSize: 17,
    flex: 1,
    textAlign: 'right',
  },
});