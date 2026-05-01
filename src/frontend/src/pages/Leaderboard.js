import "./Leaderboard.css";
import React from "react";

export default function Leaderboard({ leaderboardData }) {
  return (
    <div className="leaderboard-container">
      <div className="lb-title-box neon-box">
        <span className="neon-text">VE KAZANAN!!!</span>
      </div>

      {leaderboardData.length > 0 && (
        <div className="lb-first-place-box neon-box">
          <span className="lb-first-name neon-text">
            {leaderboardData[0].name}
          </span>
          <div className="lb-first-score-box neon-box">
            <span className="neon-text">
              {leaderboardData[0].score}/{leaderboardData[0].total}
            </span>
          </div>
        </div>
      )}

      <div className="lb-runners-wrapper">
        {leaderboardData.slice(1).map((player, index) => (
          <div key={player.id} className="lb-runner-row">
            <div className="lb-runner-rank neon-box">
              <span className="neon-text">{index + 2}.</span>
            </div>
            <div className="lb-runner-name-box neon-box">
              <span className="lb-runner-name neon-text">{player.name}</span>
              <div className="lb-runner-score-box neon-box">
                <span className="neon-text">
                  {player.score}/{player.total}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}