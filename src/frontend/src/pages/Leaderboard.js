import "./Leaderboard.css";
import React from "react";

// Sıralama (Leaderboard) ekranı.
// Quiz bittikten sonra tüm oyuncuların puanlarını sıradan gösterir.
// İlk sıradaki oyuncu ayrı ve büyük bir kutuda öne çıkarılır.
export default function Leaderboard({ leaderboardData }) {
  return (
    <div className="leaderboard-container">

      {/* "VE KAZANAN!!!" başlık kutusu */}
      <div className="lb-title-box neon-box">
        <span className="neon-text">VE KAZANAN!!!</span>
      </div>

      {/* Birinci sıradaki oyuncu için özel büyük kutu */}
      {leaderboardData.length > 0 && (
        <div className="lb-first-place-box neon-box">
          {/* Birincinin ismi ortada büyük gösterilir */}
          <span className="lb-first-name neon-text">
            {leaderboardData[0].name}
          </span>

          {/* Birincinin skoru sağ köşede küçük kutuda gösterilir */}
          <div className="lb-first-score-box neon-box">
            <span className="neon-text">
              {leaderboardData[0].score}/{leaderboardData[0].total}
            </span>
          </div>
        </div>
      )}

      {/* 2. sıradan itibaren diğer oyuncuların listesi (kaydırılabilir) */}
      <div className="lb-runners-wrapper">
        {leaderboardData.slice(1).map((player, index) => (
          <div key={player.id} className="lb-runner-row">

            {/* Sıra numarası kutusu (2. 3. 4. ...) */}
            <div className="lb-runner-rank neon-box">
              <span className="neon-text">{index + 2}.</span>
            </div>

            {/* Oyuncu ismi ve skoru yan yana */}
            <div className="lb-runner-name-box neon-box">
              <span className="lb-runner-name neon-text">{player.name}</span>

              {/* Skor kutusu sağ köşeye yapışık konumlanır */}
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