import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Plus, Trash2, Play } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Section } from "./Section";

const ACCENT = "#7C3AED";

const AnimatedView = Animated.createAnimatedComponent(View);

function VideoThumb({ uri, width, height, borderRadius }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = true;
  });

  useEffect(() => {
    // Try to load a first frame so the tile doesn't look "empty".
    // This keeps it muted and immediately pauses.
    let t = null;
    try {
      t = setTimeout(() => {
        try {
          player.play();
          setTimeout(() => {
            try {
              player.pause();
            } catch {
              // ignore
            }
          }, 120);
        } catch {
          // ignore
        }
      }, 50);
    } catch {
      // ignore
    }

    return () => {
      try {
        if (t) clearTimeout(t);
      } catch {
        // ignore
      }
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      contentFit="cover"
      nativeControls={false}
      style={{ width, height, borderRadius }}
    />
  );
}

function DraggablePhotoTile({
  url,
  photoIndex,
  tileWidth,
  tileHeight,
  gap,
  columns,
  uploading,
  onStartDrag,
  onMaybeSwap,
  onEndDrag,
  onRemove,
}) {
  const isActive = useSharedValue(0);
  const tileDragX = useSharedValue(0);
  const tileDragY = useSharedValue(0);
  const tileSwapOffsetX = useSharedValue(0);
  const tileSwapOffsetY = useSharedValue(0);

  const stepX = tileWidth + gap;
  const stepY = tileHeight + gap;

  const gesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(!uploading)
      .activateAfterLongPress(80)
      .onBegin(() => {
        isActive.value = 1;
        tileDragX.value = 0;
        tileDragY.value = 0;
        tileSwapOffsetX.value = 0;
        tileSwapOffsetY.value = 0;
        runOnJS(onStartDrag)(url, photoIndex);
      })
      .onUpdate((e) => {
        const dx = e.translationX - tileSwapOffsetX.value;
        const dy = e.translationY - tileSwapOffsetY.value;

        tileDragX.value = dx;
        tileDragY.value = dy;

        const thresholdX = stepX / 2;
        const thresholdY = stepY / 2;

        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        // Prefer the axis with larger movement so diagonal drags feel predictable
        if (absX >= absY) {
          if (dx > thresholdX) {
            tileSwapOffsetX.value = tileSwapOffsetX.value + stepX;
            runOnJS(onMaybeSwap)(1);
          } else if (dx < -thresholdX) {
            tileSwapOffsetX.value = tileSwapOffsetX.value - stepX;
            runOnJS(onMaybeSwap)(-1);
          }
        } else {
          if (dy > thresholdY) {
            tileSwapOffsetY.value = tileSwapOffsetY.value + stepY;
            runOnJS(onMaybeSwap)(columns);
          } else if (dy < -thresholdY) {
            tileSwapOffsetY.value = tileSwapOffsetY.value - stepY;
            runOnJS(onMaybeSwap)(-columns);
          }
        }
      })
      .onFinalize(() => {
        isActive.value = 0;
        tileDragX.value = withSpring(0, { damping: 18, stiffness: 260 });
        tileDragY.value = withSpring(0, { damping: 18, stiffness: 260 });
        tileSwapOffsetX.value = 0;
        tileSwapOffsetY.value = 0;
        runOnJS(onEndDrag)();
      });
  }, [
    columns,
    gap,
    isActive,
    onEndDrag,
    onMaybeSwap,
    onStartDrag,
    photoIndex,
    stepX,
    stepY,
    tileDragX,
    tileDragY,
    tileHeight,
    tileSwapOffsetX,
    tileSwapOffsetY,
    tileWidth,
    uploading,
    url,
  ]);

  const animatedStyle = useAnimatedStyle(() => {
    const active = isActive.value === 1;
    return {
      transform: [
        { translateX: tileDragX.value },
        { translateY: tileDragY.value },
        { scale: active ? 1.03 : 1 },
      ],
      zIndex: active ? 20 : 1,
      shadowOpacity: active ? 0.16 : 0,
    };
  }, []);

  return (
    <GestureDetector gesture={gesture}>
      <AnimatedView
        style={[
          {
            width: tileWidth,
            height: tileHeight,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: "#fff",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 14,
          },
          animatedStyle,
        ]}
      >
        <Image
          source={{ uri: url }}
          style={{ width: tileWidth, height: tileHeight, borderRadius: 16 }}
          contentFit="cover"
        />

        <TouchableOpacity
          onPress={() => onRemove(url)}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "rgba(17,17,17,0.7)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trash2 size={14} color="#fff" />
        </TouchableOpacity>
      </AnimatedView>
    </GestureDetector>
  );
}

export function PhotosSection({
  photos,
  videos,
  // kept for backward compatibility (older versions used a combined media order)
  mediaOrder,
  onChangeMediaOrder,
  onReorderPhotos,
  uploading,
  uploadProgress,
  uploadBytesSent,
  uploadBytesTotal,
  onAddPhoto,
  onAddVideo,
  onRemovePhoto,
  onRemoveVideo,
}) {
  const safePhotos = Array.isArray(photos) ? photos : [];
  const safeVideos = Array.isArray(videos) ? videos : [];

  const safeOnReorderPhotos =
    typeof onReorderPhotos === "function" ? onReorderPhotos : null;

  // Local order so we can render swaps immediately while dragging.
  const [localPhotos, setLocalPhotos] = useState(safePhotos);
  const latestPhotosRef = useRef(localPhotos);

  const [draggingUrl, setDraggingUrl] = useState(null);
  const draggingIndexRef = useRef(null);

  // Grid sizing
  const [gridWidth, setGridWidth] = useState(null);
  const columns = 3;
  const gap = 12;

  // Match the old tile proportions (110x140)
  const heightRatio = 140 / 110;
  const tileWidth =
    typeof gridWidth === "number" && gridWidth > 0
      ? Math.floor((gridWidth - gap * (columns - 1)) / columns)
      : 110;
  const tileHeight = Math.round(tileWidth * heightRatio);

  const PHOTO_TILE_OFFSET = 2; // Add Photo + Add Video live before photo tiles

  useEffect(() => {
    latestPhotosRef.current = localPhotos;
  }, [localPhotos]);

  useEffect(() => {
    // Only sync from props when we are NOT dragging.
    if (draggingUrl) return;
    setLocalPhotos(safePhotos);
  }, [draggingUrl, safePhotos]);

  const moveItem = useCallback((arr, from, to) => {
    const next = Array.isArray(arr) ? [...arr] : [];
    if (from === to) return next;
    const item = next[from];
    next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }, []);

  const fireHaptic = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
  }, []);

  const onStartDrag = useCallback(
    async (url, photoIndex) => {
      if (uploading) return;
      setDraggingUrl(url);
      draggingIndexRef.current = photoIndex;
      await fireHaptic();
    },
    [fireHaptic, uploading],
  );

  const onMaybeSwap = useCallback(
    (tileDelta) => {
      const fromPhotoIndex = draggingIndexRef.current;
      if (typeof fromPhotoIndex !== "number") return;

      const prev = latestPhotosRef.current;
      const photoCount = prev.length;
      if (photoCount <= 1) return;

      const fromTileIndex = PHOTO_TILE_OFFSET + fromPhotoIndex;
      const nextTileIndex = fromTileIndex + tileDelta;

      const minTile = PHOTO_TILE_OFFSET;
      const maxTile = PHOTO_TILE_OFFSET + photoCount - 1;
      if (nextTileIndex < minTile || nextTileIndex > maxTile) {
        return;
      }

      const toPhotoIndex = nextTileIndex - PHOTO_TILE_OFFSET;
      if (toPhotoIndex === fromPhotoIndex) return;

      const next = moveItem(prev, fromPhotoIndex, toPhotoIndex);
      draggingIndexRef.current = toPhotoIndex;
      latestPhotosRef.current = next;
      setLocalPhotos(next);

      if (safeOnReorderPhotos) {
        safeOnReorderPhotos(next);
      }
    },
    [moveItem, safeOnReorderPhotos],
  );

  const onEndDrag = useCallback(() => {
    draggingIndexRef.current = null;
    setDraggingUrl(null);

    // Final commit (in case we swapped zero times)
    if (safeOnReorderPhotos) {
      safeOnReorderPhotos(latestPhotosRef.current);
    }
  }, [safeOnReorderPhotos]);

  const onRemoveByUrl = useCallback(
    (url) => {
      const prev = latestPhotosRef.current;
      const next = prev.filter((p) => p !== url);

      latestPhotosRef.current = next;
      setLocalPhotos(next);

      if (safeOnReorderPhotos) {
        safeOnReorderPhotos(next);
        return;
      }

      if (typeof onRemovePhoto === "function") {
        const idx = safePhotos.findIndex((p) => p === url);
        if (idx >= 0) {
          onRemovePhoto(idx);
        }
      }
    },
    [onRemovePhoto, safeOnReorderPhotos, safePhotos],
  );

  const percent =
    typeof uploadProgress === "number" && Number.isFinite(uploadProgress)
      ? Math.max(0, Math.min(1, uploadProgress))
      : null;
  const percentLabel =
    percent !== null ? `${Math.round(percent * 100)}%` : null;

  const formatMB = (bytes) => {
    const n = Number(bytes);
    if (!Number.isFinite(n) || n <= 0) return null;
    return (n / (1024 * 1024)).toFixed(1);
  };

  const sentMB = formatMB(uploadBytesSent);
  const totalMB = formatMB(uploadBytesTotal);

  let uploadDetail = null;
  if (uploading) {
    if (percentLabel && sentMB && totalMB) {
      uploadDetail = `Uploading ${percentLabel} (${sentMB}/${totalMB} MB)`;
    } else if (percentLabel) {
      uploadDetail = `Uploading ${percentLabel}`;
    } else {
      uploadDetail = "Uploading…";
    }
  }

  const showProgressBar = uploading && percent !== null;

  // Build grid tiles: always show 2 rows (6 slots). Show 3 rows (9 slots) once media grows.
  const baseTiles = useMemo(() => {
    const tiles = [];
    tiles.push({ type: "addPhoto" });
    tiles.push({ type: "addVideo" });

    for (const url of localPhotos) {
      tiles.push({ type: "photo", url });
    }

    if (safeVideos[0]) {
      tiles.push({ type: "video", url: safeVideos[0] });
    }

    return tiles;
  }, [localPhotos, safeVideos]);

  const tiles = useMemo(() => {
    const minSlots = 6;
    const maxSlots = 9;

    const targetSlots = baseTiles.length > minSlots ? maxSlots : minSlots;
    const padded = [...baseTiles];
    while (padded.length < targetSlots) {
      padded.push({ type: "empty" });
    }
    return padded;
  }, [baseTiles]);

  const gridRows = Math.ceil(tiles.length / columns);

  return (
    <Section
      title="Media"
      subtitle="Add up to 6 photos and 1 video (max 30s). Press and hold a photo to reorder — the first photo is your main one."
    >
      {uploadDetail ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 12, color: "#6B7280" }}>{uploadDetail}</Text>
          {showProgressBar ? (
            <View
              style={{
                marginTop: 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: "#E5E7EB",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 6,
                  width: `${Math.round(percent * 100)}%`,
                  backgroundColor: ACCENT,
                }}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      <View
        onLayout={(e) => {
          const w = e?.nativeEvent?.layout?.width;
          if (typeof w === "number" && Number.isFinite(w) && w > 0) {
            setGridWidth(w);
          }
        }}
        style={{ flexDirection: "row", flexWrap: "wrap" }}
      >
        {tiles.map((t, idx) => {
          const col = idx % columns;
          const row = Math.floor(idx / columns);
          const isLastCol = col === columns - 1;
          const isLastRow = row === gridRows - 1;

          const marginRight = isLastCol ? 0 : gap;
          const marginBottom = isLastRow ? 0 : gap;

          const baseStyle = {
            width: tileWidth,
            height: tileHeight,
            borderRadius: 16,
            marginRight,
            marginBottom,
          };

          if (t.type === "addPhoto") {
            return (
              <Pressable
                key={`tile-add-photo-${idx}`}
                onPress={uploading ? undefined : onAddPhoto}
                style={{
                  ...baseStyle,
                  borderWidth: 1,
                  borderColor: "#E5E5EA",
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                  // (avoid `gap` for compatibility)
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={ACCENT} />
                ) : (
                  <Plus size={22} color={ACCENT} />
                )}
                <Text style={{ fontSize: 13, color: "#111", marginTop: 8 }}>
                  Add photo
                </Text>
              </Pressable>
            );
          }

          if (t.type === "addVideo") {
            return (
              <Pressable
                key={`tile-add-video-${idx}`}
                onPress={uploading ? undefined : onAddVideo}
                style={{
                  ...baseStyle,
                  borderWidth: 1,
                  borderColor: "#E5E5EA",
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                  // (avoid `gap` for compatibility)
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={ACCENT} />
                ) : (
                  <Play size={22} color={ACCENT} />
                )}
                <Text style={{ fontSize: 13, color: "#111", marginTop: 8 }}>
                  Add video
                </Text>
              </Pressable>
            );
          }

          if (t.type === "empty") {
            return (
              <View
                key={`tile-empty-${idx}`}
                style={{
                  ...baseStyle,
                  borderWidth: 1,
                  borderColor: "rgba(17,17,17,0.08)",
                  backgroundColor: "rgba(255,255,255,0.55)",
                }}
              />
            );
          }

          if (t.type === "video") {
            return (
              <View
                key={`tile-video-${idx}`}
                style={{
                  ...baseStyle,
                  overflow: "hidden",
                  backgroundColor: "#111",
                }}
              >
                <VideoThumb
                  uri={t.url}
                  width={tileWidth}
                  height={tileHeight}
                  borderRadius={16}
                />

                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.25)",
                  }}
                >
                  <Play size={26} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 13, marginTop: 8 }}>
                    Video
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => onRemoveVideo(0)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Trash2 size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            );
          }

          // photo
          const photoIndex = localPhotos.findIndex((p) => p === t.url);
          const resolvedPhotoIndex = photoIndex >= 0 ? photoIndex : 0;

          return (
            <View key={`tile-photo-wrap-${t.url}-${idx}`} style={baseStyle}>
              <DraggablePhotoTile
                url={t.url}
                photoIndex={resolvedPhotoIndex}
                tileWidth={tileWidth}
                tileHeight={tileHeight}
                gap={gap}
                columns={columns}
                uploading={uploading}
                onStartDrag={onStartDrag}
                onMaybeSwap={onMaybeSwap}
                onEndDrag={onEndDrag}
                onRemove={onRemoveByUrl}
              />
            </View>
          );
        })}
      </View>
    </Section>
  );
}
