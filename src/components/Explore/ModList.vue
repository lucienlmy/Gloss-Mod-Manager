<script lang='ts' setup>
import { ref, computed } from "vue";
import { useRoute } from 'vue-router'
import { IMod } from "@src/model/Interfaces";
import { useMain } from "@src/stores/useMain";

const props = defineProps<{
    mod: IMod
}>()
const route = useRoute()
const { get_number, lazy_img, host } = useMain()

let mod = ref<IMod>(props.mod);

let order = computed(() => {
    return parseInt(route.query.order as string) || 0
})
let title = computed(() => {
    return route.query.title as string
})

let mod_img = computed(() => {
    let img = ''
    if (mod.value.mods_image_url) {
        img = host + mod.value.mods_image_url
    } else {
        img = host + mod.value.game_imgUrl
    }
    return img
})

let user_avatar = computed(() => {

    // 判断 mod.value.user_avatar 是否包含 my.3dmgame.com
    if (mod.value.user_avatar?.includes('my.3dmgame.com')) {
        return mod.value.user_avatar
    }
    return host + mod.value.user_avatar
})

let to = computed(() => {
    let query: any = {}
    if (title.value) query["title"] = title.value
    return {
        name: 'ModView',
        params: { id: props.mod.id },
        query: query
    }
})

</script>
<template>
    <div class="mod">
        <v-row>
            <v-col cols="12" class="mod-img" :title="mod.mods_desc">
                <a :href="`https://mod.3dmgame.com/mod/${mod.id}`">
                    <v-img :lazy-src="lazy_img" width="100%" :aspect-ratio="100 / 56" :src="mod_img" :alt="mod.mods_title"
                        min-height="150px" :class="{ 'vague': mod.mods_adult_content }">
                    </v-img>
                </a>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12" class="mod-user">
                <div class="mod-user-avatar" :title="mod.user_nickName">
                    <a :href="`${host}/u/${mod.mods_publish}`" target="_blank">
                        <v-avatar>
                            <v-img :lazy-src="lazy_img" :src="user_avatar" width="40" height="40" :alt="mod.user_nickName">
                            </v-img>
                        </v-avatar>
                    </a>
                </div>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12" class="mod-title" :title="mod.mods_title">
                <router-link :to="to">
                    {{ mod.mods_title }}
                </router-link>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12" class="mod-game">
                <v-icon icon="mdi-microsoft-xbox-controller"></v-icon>
                <a :href="`https://mod.3dmgame.com/${mod.game_path}`" class="mod-game-name">
                    {{ mod.game_name }}
                </a>
                <span> > </span>
                <a :href="`https://mod.3dmgame.com/${mod.game_path}/${mod.mods_type_id}`">
                    {{ mod.mods_type_name }}
                </a>
            </v-col>
        </v-row>
        <v-row class="mod-data">
            <v-col cols="8" class="mod-data-time" :title="mod.mods_updateTime">
                <v-icon icon="mdi-clock-outline" /> {{ mod.mods_updateTime }}
            </v-col>
            <v-col cols="4" class="mod-data-info">
                <span v-if="order == 2">
                    <v-icon icon="mdi-download" /> {{ get_number(mod.mods_download_cnt) }}
                </span>
                <span v-else-if="order == 3">
                    <v-icon icon="mdi-thumb-up-outline" /> {{ get_number(mod.mods_mark_cnt) }}
                </span>
                <span v-else>
                    <v-icon icon="mdi-eye-outline" /> {{ get_number(mod.mods_click_cnt) }}
                </span>
            </v-col>
        </v-row>
    </div>
</template>
<script lang='ts'>

export default {
    name: 'ExploreModList',
}
</script>
<style lang='less' scoped>
.mod {
    position: relative;

    .mod-img {
        .mod-tag {
            position: absolute;
            right: 0;
            top: 12px;
            z-index: 10;
        }

        .vague {
            // 高斯模糊
            -webkit-filter: blur(10px);
            /* Chrome, Opera */
            -moz-filter: blur(10px);
            -ms-filter: blur(10px);
            filter: blur(10px);
        }
    }


    a {
        text-decoration: none;
        color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity));

        &:hover {
            opacity: .8;
        }
    }

    .mod-user {
        position: relative;

        .mod-user-avatar {
            position: absolute;
            right: 15px;
            top: -25px;
            padding: 0.5rem;
            background: rgb(var(--v-theme-background));
            border-radius: 50%;
        }
    }

    .mod-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .mod-game {
        display: flex;
        align-items: center;
        font-size: 0.8rem;

        .mod-game-name {
            max-width: 60%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .mdi {
            margin-right: .5rem;
        }

        span {
            margin: 0 .5rem;
        }
    }

    .mod-data {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.6rem;

        .mod-data-info {
            display: flex;
            align-items: center;
            justify-content: space-around;
        }

        .mod-data-time {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

}
</style>