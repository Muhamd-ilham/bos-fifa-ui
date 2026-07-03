import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

const MatchEngine = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 400,
      parent: 'phaser-container',
      backgroundColor: '#2e8b57',
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: { create: create, update: update }
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    let ball, playerRed, playerBlue;
    let isPlaying = false;
    let goalText; // Variabel buat nyimpen teks GOAL

    function create() {
      const graphics = this.add.graphics();
      
      // 1. Gambar Garis Lapangan Utama
      graphics.lineStyle(4, 0xffffff, 1);
      graphics.strokeRect(20, 20, 760, 360); 
      graphics.lineBetween(400, 20, 400, 380); 
      graphics.strokeCircle(400, 200, 60); 

      // 2. Gambar Gawang Kiri (Area Tim Merah)
      graphics.lineStyle(4, 0xffcccc, 1);
      graphics.strokeRect(20, 150, 40, 100); 

      // 3. Gambar Gawang Kanan (Area Tim Biru)
      graphics.lineStyle(4, 0xccccff, 1);
      graphics.strokeRect(740, 150, 40, 100);

      this.add.text(280, 40, '⚽ LIVE MATCH ENGINE', { fontSize: '18px', fill: '#FFF', fontStyle: 'bold' });

      // 4. Siapkan Animasi Teks GOAL (Disembunyikan di awal)
      goalText = this.add.text(400, 200, 'G O A L !', { 
        fontSize: '64px', fill: '#FFD700', fontStyle: 'bold', stroke: '#000', strokeThickness: 6 
      }).setOrigin(0.5).setVisible(false);

      playerRed = this.add.circle(200, 200, 12, 0xff0000); 
      playerBlue = this.add.circle(600, 200, 12, 0x0000ff); 
      ball = this.add.circle(400, 200, 8, 0xffffff); 

      this.physics.add.existing(playerRed);
      this.physics.add.existing(playerBlue);
      this.physics.add.existing(ball);

      ball.body.setCollideWorldBounds(true);
      ball.body.setBounce(1, 1);
      playerRed.body.setCollideWorldBounds(true);
      playerBlue.body.setCollideWorldBounds(true);

      this.physics.add.collider(playerRed, ball);
      this.physics.add.collider(playerBlue, ball);
      this.physics.add.collider(playerRed, playerBlue);

      this.physics.pause();

      const handleStartMatch = () => {
        if (isPlaying) return; // Mencegah Abang klik tombol berkali-kali pas animasi jalan
        isPlaying = true;
        goalText.setVisible(false); // Sembunyikan tulisan goal sebelumnya
        this.physics.resume(); 
        
        // Tendangan awal lebih kencang biar seru
        const velocityX = Math.random() > 0.5 ? 250 : -250;
        const velocityY = Math.random() > 0.5 ? 250 : -250;
        ball.body.setVelocity(velocityX, velocityY);

        setTimeout(() => {
          isPlaying = false;
          this.physics.pause(); 
          ball.body.setVelocity(0, 0);
          
          playerRed.setPosition(200, 200);
          playerBlue.setPosition(600, 200);
          ball.setPosition(400, 200);
        }, 3000); 
      };

      window.addEventListener('startMatch', handleStartMatch);

      this.events.on('destroy', () => {
        window.removeEventListener('startMatch', handleStartMatch);
      });
    }

    function update() {
      if (isPlaying) {
        this.physics.moveToObject(playerRed, ball, 130); 
        this.physics.moveToObject(playerBlue, ball, 125); 

        // 5. SENSOR GOL SAKTI
        // Mengecek apakah bola masuk ke kotak gawang kiri atau kanan
        if ((ball.x < 60 && ball.y > 150 && ball.y < 250) || 
            (ball.x > 740 && ball.y > 150 && ball.y < 250)) {
            
            goalText.setVisible(true); // Munculkan tulisan GOAL!
            
            // Pantulkan bola keluar dari gawang biar nggak nyangkut di jaring
            ball.body.setVelocity(ball.body.velocity.x * -1, ball.body.velocity.y * -1);
        }
      }
    }

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <div className="card" style={{ marginBottom: '25px' }}>
      <h2>📺 Siaran Langsung (Live Match)</h2>
      <div id="phaser-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}></div>
    </div>
  );
};

export default MatchEngine;