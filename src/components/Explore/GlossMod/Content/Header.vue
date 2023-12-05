<script lang='ts' setup>

import { useContent } from "@src/stores/useContent";
import { computed } from "vue";

import ExploreContentCarousel from "@src/components/Explore/GlossMod/Content/Carousel.vue";
import ExploreContentInfo from "@src/components/Explore/GlossMod/Content/Info.vue";

const content = useContent()

let items = computed(() => [
    {
        text: 'Home',
        href: '/',
    },
    {
        text: 'Tour',
        href: '/explore',
    },
    {
        text: content.modData?.mods_title || "",
        href: `/explore/${content.modData?.id}`,
        disabled: true
    },
])

</script>
<template>
    <v-row>
        <v-col cols="12">
            <ul class="breadcrumbs">
                <v-icon icon="mdi-home"></v-icon>
                <li v-for=" (item, index) in items" :key="index">
                    <RouterLink :to="item.href" class="link" :class="{ 'disabled': item.disabled }">
                        {{ $t(item.text as string) }}
                    </RouterLink>
                </li>
            </ul>
        </v-col>
        <v-col cols="12" class="title">
            <h1>{{ content.modData?.mods_title }}</h1>
        </v-col>
        <v-col cols="12" md="6">
            <ExploreContentCarousel></ExploreContentCarousel>
        </v-col>
        <v-col cols="12" md="6">
            <ExploreContentInfo></ExploreContentInfo>
        </v-col>
    </v-row>
</template>
<script lang='ts'>

export default {
    name: 'ExploreContentHeader',
}
</script>
<style lang='less' scoped>
.breadcrumbs {
    padding: 8px 12px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    font-size: 0.8rem;

    .link {
        color: unset;
        text-decoration: none;
        transition: all .5s;

        &:hover {
            opacity: .7;
        }
    }

    li {
        list-style: none;
        display: flex;
        align-items: center;
        margin-left: 8px;

        &::after {
            content: '/';
            display: inline-block;
            padding: 0 8px;
            vertical-align: middle;
        }

        &:last-child::after {
            content: ''
        }

        .disabled {
            opacity: .7;
            cursor: context-menu;
        }

    }
}

.title {
    h1 {
        font-size: 1.4rem;
        text-align: center;
    }
}
</style>