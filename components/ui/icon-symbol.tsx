// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "calendar": "calendar-month",
  "magnifyingglass": "search",
  "chart.bar.fill": "bar-chart",
  "person.fill": "person",
  "plus": "add",
  "xmark": "close",
  "arrow.left": "arrow-back",
  "ellipsis": "more-vert",
  "photo": "image",
  "phone": "phone",
  "building": "apartment",
  "door": "door-back",
  "bed.double": "bed",
  "person.2": "group",
  "checkmark": "check",
  "exclamationmark.circle": "error",
  "info.circle": "info",
  "warning": "warning",
  "trash": "delete",
  "pencil": "edit",
  "eye": "visibility",
  "eye.slash": "visibility-off",
  "lock": "lock",
  "unlock": "lock-open",
  "heart": "favorite",
  "star": "star",
  "bell": "notifications",
  "bell.fill": "notifications-active",
  "gear": "settings",
  "doc": "description",
  "doc.text": "article",
  "folder": "folder",
  "link": "link",
  "share": "share",
  "download": "download",
  "upload": "upload",
  "refresh": "refresh",
  "filter": "filter-list",
  "sort": "sort",
  "arrow.up": "arrow-upward",
  "arrow.down": "arrow-downward",
  "arrow.left.arrow.right": "compare-arrows",
  "checkmark.circle": "check-circle",
  "xmark.circle": "cancel",
  "question.circle": "help",
  "clock": "schedule",
  "calendar.badge.clock": "event-available",
  "map": "map",
  "location": "location-on",
  "phone.fill": "phone",
  "envelope": "mail",
  "globe": "public",
  "wifi": "wifi",
  "battery.100": "battery-full",
  "sun.max": "light-mode",
  "moon": "dark-mode",
  "square.and.pencil": "edit-note",
  "text.alignleft": "format-align-left",
  "text.aligncenter": "format-align-center",
  "text.alignright": "format-align-right",
  "list.bullet": "list",
  "list.number": "format-list-numbered",
  "checkmark.square": "check-box",
  "square": "checkbox-blank-outline",
  "toggle.2": "toggle-on",
  "toggle.off": "toggle-off",
  "slider.horizontal.3": "tune",
  "slider.horizontal.below.rectangle": "volume-mute",
  "slider.horizontal.below.sun.max": "brightness-7",
  "minus": "remove",
  "multiply": "close",
  "divide": "functions",
  "equal": "equal",
  "percent": "percent",
  "number": "looks-one",
  "sum": "add-circle",
  "function": "functions",
  "curlybraces": "code",
  "square.and.arrow.up": "share",
  "square.and.arrow.down": "download",
  "square.and.arrow.up.on.square": "open-in-new",
  "square.and.arrow.down.on.square": "save-alt",
  "square.on.square": "content-copy",
  "square.on.square.dashed": "content-paste",
  "square.fill.on.square.fill": "layers",
  "square.fill": "check-box",
  "square.fill.text.grid.1x2": "dashboard",
  "rectangle.grid.1x2": "view-agenda",
  "rectangle.grid.2x2": "dashboard",
  "rectangle.grid.3x2": "view-module",
  "square.grid.2x2": "apps",
  "square.grid.3x2": "view-comfy",
  "square.grid.4x3.topfilled": "grid-view",
  "square.grid.4x3.fill": "grid-on",
  "square.grid.2x2.fill": "apps",
  "square.grid.3x3": "dashboard-customize",
  "square.grid.3x3.fill": "dashboard",
  "square.grid.3x3.topfilled": "dashboard-customize",
  "square.grid.3x3.bottombottom.filled": "dashboard",
  "square.grid.3x3.bottombottom.filled.invert": "dashboard",
  "square.grid.3x3.square": "dashboard",
  "square.grid.3x3.square.fill": "dashboard",
  "square.grid.3x3.square.fill.invert": "dashboard",
  "square.grid.3x3.square.fill.invert.topfilled": "dashboard",
  "square.grid.3x3.square.fill.invert.topfilled.bottomfilled": "dashboard",
} as const;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] as any} style={style} />;
}
