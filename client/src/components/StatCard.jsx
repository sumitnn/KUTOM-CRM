

const StatCard = ({ icon, title, value, description, color = "primary", avatar }) => {
  return (
    <div className="stat">
      <div className={`stat-figure text-${color}`}>
        {avatar ? (
          <div className="avatar online">
            <div className="w-16 rounded-full">
              <img src={avatar} alt="Avatar" />
            </div>
          </div>
        ) : (
          icon
        )}
      </div>
      <div className="stat-title font-extrabold">{title}</div>
      <div className={`stat-value text-${color}`}>{value}</div>
      <div className="stat-desc font-bold">{description}</div>
    </div>
  );
};

export default StatCard;
