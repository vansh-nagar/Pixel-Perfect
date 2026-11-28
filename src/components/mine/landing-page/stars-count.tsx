import { useEffect, useState } from "react";

let starsRequest: Promise<number | null> | null = null;

const fetchStars = () => {
  starsRequest ??= fetch("https://api.github.com/repos/vansh-nagar/Pixel-Perfect")
    .then((response) => (response.ok ? response.json() : null))
    .then((data) =>
      typeof data?.stargazers_count === "number" ? data.stargazers_count : null,
    )
    .catch((error) => {
      console.error("Failed to fetch GitHub stars:", error);
      return null;
    });
  return starsRequest;
};

export function StarsCount() {
  const [stars, setStars] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchStars().then((count) => {
      if (!alive) return;
      setStars(count);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (loading || stars === null) {
    return <span>??</span>;
  }

  return <span className="flex gap-1 items-center">{stars}</span>;
}
