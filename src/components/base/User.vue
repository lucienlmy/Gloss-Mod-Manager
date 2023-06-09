<script lang='ts' setup>
import { useUser } from '@src/stores/useUser'
import BaseLogin from '@src/components/base/Login/Login.vue'
import { useSettings } from '@src/stores/useSettings'
import { computed } from "vue";

const user = useUser()
const settings = useSettings()

// console.log(user.user);
let user_avatar = computed(() => {
    if (user.user?.user_avatar) {
        // 判断是否包含 my.3dmgame.com
        if (user.user.user_avatar.indexOf('my.3dmgame.com') != -1) {
            return user.user.user_avatar
        } else {
            return `https://mod.3dmgame.com${user.user.user_avatar}`
        }
    }
})

if (!user.user) {
    user.getUser()
}

</script>
<template>
    <div class="user">
        <v-col cols="12" class="user-avatar" v-if="!user.user">
            <v-avatar icon="mdi-account" size="30" @click="user.loginBox = true"> </v-avatar>
            <div class="btn" v-if="!settings.settings.leftMenuRail">
                <v-btn variant="text" @click="user.loginBox = true">登录</v-btn>
                <v-btn variant="text" href="https://my.3dmgame.com/register">注册</v-btn>
            </div>
            <BaseLogin v-if="user.loginBox"></BaseLogin>
        </v-col>
        <v-col cols="12" class="user-data" v-else>
            <v-avatar size="35">
                <v-img :src="user_avatar" :alt="user.user.user_nickName" />
            </v-avatar>
            <div v-if="!settings.settings.leftMenuRail" class="user-operate">
                <div class="user-name">{{ user.user.user_nickName }}</div>
                <v-btn variant="text" @click="user.logout">退出</v-btn>
            </div>
        </v-col>
    </div>
</template>
<script lang='ts'>

export default {
    name: 'BaseUser',
}
</script>
<style lang='less' scoped>
.user {
    padding: 0.5rem 0;

    .user-avatar {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .user-data {
        display: flex;
        flex-direction: column;
        align-items: center;

        .user-operate {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.5rem 0;
        }
    }
}
</style>