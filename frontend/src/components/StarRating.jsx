import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({
  rating = 0,
  totalRatings = 0,
  interactive = false,
  onRate = null,
  size = 18,
  showCount = true
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : Number(rating) || 0;

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = displayRating >= star;
          const isHalf = displayRating >= star - 0.5 && displayRating < star;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate && onRate(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'} p-0.5 text-amber-400 focus:outline-none`}
            >
              <Star
                size={size}
                className={
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-200 text-amber-400'
                    : 'text-slate-300'
                }
              />
            </button>
          );
        })}
      </div>

      {showCount && (
        <span className="text-xs font-medium text-slate-600 ml-1">
          {rating > 0 ? Number(rating).toFixed(1) : 'Unrated'}
          {totalRatings > 0 && ` (${totalRatings})`}
        </span>
      )}
    </div>
  );
}
