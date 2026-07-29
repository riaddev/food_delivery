import React from "react";

const cuisines = [
  { icon: "🍔", label: "American" },
  { icon: "🍝", label: "Italian" },
  { icon: "🍱", label: "Japanese" },
  { icon: "🌮", label: "Mexican" },
  { icon: "🥟", label: "Chinese" },
  { icon: "🍛", label: "Indian" },
  { icon: "🥗", label: "Healthy" },
  { icon: "🍗", label: "Chicken" },
  { icon: "🍖", label: "BBQ" },
  { icon: "🍰", label: "Desserts" },
  { icon: "🥤", label: "Drinks" },
];

const CuisineStrip = () => {
  return (
    <section className="sb-cuisines sb-root">
      <div className="sb-container">
        <div className="sb-cuisines-label">Serving all your favourite cuisines</div>
        <div className="sb-cuisines-row">
          {cuisines.map((c) => (
            <span className="sb-cuisine-pill" key={c.label}>
              <span>{c.icon}</span>
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CuisineStrip;
