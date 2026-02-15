export function getHeaderAvatarUri(matchInfo) {
  const raw = matchInfo?.otherUser?.photos;
  let list = [];

  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    } catch {
      // ignore
    }
  }

  const first = list.find((x) => typeof x === "string" && x.length > 0);
  return first || null;
}

export function getHeaderInitial(headerTitle) {
  return (headerTitle || "?").slice(0, 1).toUpperCase();
}
