<template>
  <div class="badge-base">
    <slot></slot>
  </div>
</template>

<style scoped>
.badge-base {
  color: #777;
  padding: 10px 16px; 
  border-radius: 10px;
  font-family: 'Montserrat', sans-serif !important;
  font-size: 0.75rem;
  width: fit-content;
  display: inline-block;

  margin-bottom: 15px;
}
</style>