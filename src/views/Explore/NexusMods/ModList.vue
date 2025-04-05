<script lang='ts' setup>
import NexusModsDownloadBtn from './DownloadBtn.vue'

const props = defineProps<{
    item: INexusMods
}>()

const { getNumber, lazy_img, formatSiez } = useMain()

function timeFormat(time: string) {
    const date = new Date(time)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const userLink = computed(() => {
    return `https://next.nexusmods.com/profile/${props.item.uploader.name}?gameId=${props.item.game.id}`
})

const modLink = computed(() => {
    return `https://www.nexusmods.com/${props.item.game.domainName}/mods/${props.item.modId}`
})

</script>
<template>
    <v-card :href="modLink" target="_blank">
        <v-img :title="item.summary" :src="item.thumbnailUrl" :lazy-src="lazy_img" :aspect-ratio="16 / 9" cover></v-img>
        <v-card-text class="content">
            <div class="title" :title="item.name">{{ item.name }}</div>
            <div class="uploader-time">
                <div class="uploader" :title="item.uploader.name">
                    <a :href="userLink" target="_blank">
                        <v-avatar size="16" :image="item.uploader.avatar"></v-avatar>
                        <span>{{ item.uploader.name }}</span>
                    </a>
                </div>
                <div class="time">
                    <v-icon size="12">mdi-clock-time-eight-outline</v-icon>
                    {{ timeFormat(item.updatedAt) }}
                </div>
            </div>
            <div class="data">
                <span> <v-icon size="12">mdi-thumb-up</v-icon> {{ getNumber(item.endorsements) }}</span>
                <span> <v-icon size="12">mdi-download</v-icon> {{ getNumber(item.downloads) }}</span>
                <span> <v-icon size="12">mdi-zip-box</v-icon> {{ formatSiez(item.fileSize * 1024) }}</span>
            </div>
            <div class="action">
                <NexusModsDownloadBtn :item="item"></NexusModsDownloadBtn>
            </div>
        </v-card-text>

    </v-card>
</template>
<script lang='ts'>

export default {
    name: 'NexusModsModList',
}
</script>
<style lang='less' scoped>
.content {
    .title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .uploader-time {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        color: #999;
        padding: 0.5rem 0;

        .uploader {
            max-width: 65px;
            overflow: hidden;

            a {
                color: #999;
                text-decoration: none;
                display: flex;
                align-items: center;
                font-size: 12px;

                span {
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    overflow: hidden;
                }
            }
        }
    }

    .data {
        span {
            font-size: 12px;
            margin-right: 1rem;
        }
    }

    .action {
        text-align: right;
    }
}
</style>
