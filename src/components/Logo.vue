<template>
  <g-link to="/" class="logo" title="Back to home">
    <transition name="theme">
      <div class="logo-title">
        TNF
      </div>
    </transition>
  </g-link>
</template>

<script>
export default {
  props: {
    color: {
      type: String,
      required: true
    }
  }
}
</script>

<style lang="scss" scoped>
.logo {
  height: 40px;
  display: block;
  transition: color .15s ease-in-out;
  color: $textBright;
  position: relative;
  perspective: 200px;

  div {
    position: absolute;
    top: 0;
    left: 0;
  }

  img {
    height: 100%;
    width: auto;
  }
}

.theme-enter-active, .theme-leave-active {
  transition: opacity .15s ease-in-out;
}
.theme-enter, .theme-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.logo-title {
  font-weight: bold;
  font-size: 30px;
  padding-left: 10px;
  border-left: 5px solid #10c186;

  .dark & {
    color: #fff;
  }
}
</style>


