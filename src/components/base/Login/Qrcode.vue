<script lang='ts' setup>
import { useUser } from "@src/stores/useUser";
import { ref, onMounted } from "vue";

let qrcode = ref()
const user = useUser()

// 每隔1 秒刷新
user.timer = setInterval(() => {
    user.checkQrcodeLogin()
}, 1000)

onMounted(() => {
    user.getQrcode(qrcode.value)
})
</script>
<template>
    <div class="">
        <div class="title">打开3DM APP 扫码即可登录</div>
        <div class="qrcode">
            <canvas ref="qrcode"></canvas>
        </div>
    </div>
</template>
<script lang='ts'>

export default {
    name: 'Qrcode',
}
</script>
<style lang='less' scoped></style>