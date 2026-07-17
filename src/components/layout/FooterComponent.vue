<script setup>
import ButtonComponent from '@/components/common/ButtonComponent.vue'
import BadgeComponent from '@/components/common/BadgeComponent.vue'
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { isLoggedIn } = useAuth()

const buttonText = computed(() => isLoggedIn.value ? 'Perfil' : 'Entrar')
const buttonLink = computed(() => isLoggedIn.value ? '/profile' : '/login')
<<<<<<< Updated upstream
const buttonmapview = computed(() => isLoggedIn.value ? '/mapview' : '/login')
=======
>>>>>>> Stashed changes
</script>

<template>
  <footer class="footer">
    <div class="footer-content">
      
      <div class="footer-cta">
        <div class="cta-inner">
          <BadgeComponent 
          style="background-color: #A33DA3;
          color: white;">
            Como podemos ajudar?
          </BadgeComponent>
          <h2 class="cta-title">SEU FUTURO NÃO SE MOLDA SOZINHO.</h2>
          <p class="cta-subtitle">Quer escolher o destino perfeito pro seu futuro?</p>
          <div class="cta-buttons">

            <router-link to="/mapview">
              <ButtonComponent text="Visite o mundo" iconType="primary" />
            </router-link>
            
             <router-link :to="buttonLink">
                <ButtonComponent 
                  :text="buttonText" 
                />
              </router-link>
          </div>
        </div>
      </div>

      <div class="footer-image-container">
        <img src="/images/footerbackground.png" class="bg-image" alt="Moldando seu futuro">
        
        <div class="interactive-overlay">
          <div class="main-text-header">
            <div class="footer-social">
              <div class="social-icon">G</div>
              <div class="social-icon">X</div>
            </div>
            
            <div class="footer-contact">
              <ButtonComponent text="Entrar em contato" iconType="primary" />
            </div>
          </div>
        </div>
      </div>

    </div>
  </footer>
</template>



<style scoped>

.footer {
  background-color: #4F0B54;
  color: white;
  padding: 80px 0 0;
  font-family: 'Montserrat', sans-serif;
  overflow: hidden;
}

.footer-content {
  max-width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.footer-cta {
  text-align: center;
  padding: 0 5%;
  margin-bottom: 80px;
}

.cta-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.cta-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 40px;
  opacity: 0.8;
}


.cta-buttons {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.footer-image-container {
  position: relative;
  width: 100%;
  line-height: 0;
  margin-top: 40px;
}

.bg-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 40px 40px 0 0; 
}

.interactive-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 4% 5%;
  box-sizing: border-box;
}

.main-text-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.footer-social {
  display: flex;
  gap: 16px;
}

.social-icon {
  width: 45px;
  height: 45px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4F0B54;
  font-weight: bold;
  cursor: pointer;
  backdrop-filter: blur(5px);
}

.footer-contact {
  display: flex;
  align-items: center;
  gap: 16px;
}

.contact-dots {
  color: white;
  font-size: 1.5rem;
}
@media (max-width: 768px) {
  .footer-image-container {
    margin-top: 20px;
  }
  
  .bg-image {
    border-radius: 24px 24px 0 0;
    min-height: 250px;
    object-fit: cover;
  }

  .interactive-overlay {
    padding: 20px;
  }

  .main-text-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .social-icon {
    width: 35px;
    height: 35px;
  }
}
</style>