<script lang='ts' setup>
import { useModIo } from '@src/stores/useModIo';
import { computed } from 'vue';

import ContentInfo from "@src/components/Explore/ModIo/Content/ContentInfo.vue"

const modio = useModIo()

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
        text: modio.selected.data?.name || "",
        href: { name: 'ModIoModsContent', params: { modId: modio.selected.data?.id || 0 } },
        disabled: true
    },
])

let images = computed(() => {
    let images = modio.selected.data?.media.images

    let logo = modio.selected.data?.logo

    return images ? [logo, ...images] : [logo]
})

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
            <h1>{{ modio.selected.data?.name }}</h1>
        </v-col>
        <v-col cols="12" md="6">
            <v-carousel cycle height="290" hide-delimiter-background show-arrows="hover" interval="2000">
                <v-carousel-item v-for="item in images" :key="item?.filename" cover
                    :src="item?.thumb_1280x720"></v-carousel-item>
            </v-carousel>
        </v-col>
        <v-col cols="12" md="6">
            <ContentInfo></ContentInfo>
        </v-col>
    </v-row>
</template>
<script lang='ts'>

export default {
    name: 'ContentHeader',
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