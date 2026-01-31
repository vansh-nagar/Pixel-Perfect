import { useEffect, useState } from "react";
import TextMatrixRain from "registry/new-york/text/text-matrix-rain";

export function StarsCount() {
  const [stars, setStars] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/vansh-nagar/Pixel-Perfect",
        );
        const data = await response.json();
        setStars(data.stargazers_count);
      } catch (error) {
        console.error("Failed to fetch GitHub stars:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStars();
  }, []);

  if (loading || stars === null) {
    return <span>??</span>;
  }

  return (
    <TextMatrixRain repeat={false} className=" flex  gap-1 items-center">
      {String(stars)}
    </TextMatrixRain>
  );
}
