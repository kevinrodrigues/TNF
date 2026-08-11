<template>
  <Layout>
    <h1>
      {{ $page.doc.title }}
    </h1>
     <div class="markdown" v-html="$page.doc.content" />
  </Layout>
</template>

<page-query>
query Doc ($path: String!) {
  doc: doc (path: $path) {
    title
    path
    timeToRead
    content
  }
}
</page-query>

<script>
export default {
  metaInfo() {
    return {
      title: this.$page.doc.title,
      meta: [
        { key: 'description', name: 'description', content: this.$page.doc.description }
      ]
    }
  }
}
</script>


<style lang="scss" scoped>
::v-deep > p {
  opacity: .8;
}

::v-deep > h2, ::v-deep > h3, ::v-deep > h4, ::v-deep > h5, ::v-deep > h6 {
  padding-top: 100px;
  margin-top: -80px;

  @include respond-above(md) {
    font-size: 2rem;
  }
}

::v-deep > p > img {
    max-width: 100%;
  }

.markdown {
  padding-bottom: 50vh;
}
</style>
