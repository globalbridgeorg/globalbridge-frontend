<script setup>
// Apenas visualização
</script>

<template>
  <div class="profile-page">
    <div class="top-banner"></div>

    <div class="content">
      <div class="user-info">
        <div class="avatar-placeholder"></div>

        <div class="user-text">
          <h2>Miguelito Tufferson</h2>
          <p>miguelreidelas2002@gmail.com</p>
        </div>
      </div>

      <div class="notification-banner">
        <div class="notification-indicator"></div>

        <div class="notification-content">
          <!-- Área para avisos -->
        </div>

        <div class="close-placeholder">
          ✕
        </div>
      </div>

      <div class="cards-grid">
        <div class="card">
          <div class="icon-placeholder"></div>

          <div class="card-text">
            <h3>informações do seu perfil</h3>
            <p>dados pessoais da sua conta</p>
          </div>
        </div>

        <div class="card">
          <div class="icon-placeholder"></div>

          <div class="card-text">
            <h3>segurança</h3>
            <p>dados pessoais da sua conta</p>
          </div>
        </div>

        <div class="card">
          <div class="icon-placeholder"></div>

          <div class="card-text">
            <h3>favoritos</h3>
            <p>dados pessoais da sua conta</p>
          </div>
        </div>

        <div class="card">
          <div class="icon-placeholder"></div>

          <div class="card-text">
            <h3>minhas avaliações</h3>
            <p>dados pessoais da sua conta</p>
          </div>
        </div>

        <div class="card">
          <div class="icon-placeholder"></div>

          <div class="card-text">
            <h3>preferências de intercâmbio</h3>
            <p>dados pessoais da sua conta</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f4f1eb;
}

.top-banner {
  width: 100%;
  height: 145px;
  background: #43256f;
}

.content {
  max-width: 900px;
  margin: 0 auto;
  padding: 30px 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #d8d8d8;
  border: 2px solid #c4c4c4;
}

.user-text h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #444;
}

.user-text p {
  margin: 4px 0 0;
  font-size: 18px;
  color: #777;
}

.notification-banner {
  display: flex;
  align-items: center;
  min-height: 50px;
  margin-bottom: 30px;
  background: #f7f4ee;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.notification-indicator {
  width: 5px;
  align-self: stretch;
  background: #e34b57;
}

.notification-content {
  flex: 1;
  min-height: 50px;
}

.close-placeholder {
  padding: 0 16px;
  font-size: 18px;
  color: #b0b0b0;
  cursor: pointer;
  user-select: none;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.card {
  min-height: 110px;
  padding: 18px;
  background: #f7f4ee;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.icon-placeholder {
  width: 22px;
  height: 22px;
  margin-bottom: 14px;
  border-radius: 4px;
  background: #bdbdbd;
}

.card-text h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: #222;
}

.card-text p {
  margin-top: 4px;
  font-size: 12px;
  color: #888;
}

</style>