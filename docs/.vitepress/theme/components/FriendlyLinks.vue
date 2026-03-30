<script setup lang="ts">
import { onMounted, ref } from 'vue';

type FriendLink = {
    name: string;
    url: string;
    description?: string;
};

const links = ref<FriendLink[]>([]);
const pending = ref(true);
const failed = ref(false);

async function loadLinks() {
    try {
        const response = await fetch('https://api.aoe.top/api/friendly/links');
        if (!response.ok) {
            throw new Error(`Failed to load links: ${response.status}`);
        }

        const data = await response.json();
        links.value = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(error);
        failed.value = true;
    } finally {
        pending.value = false;
    }
}

onMounted(loadLinks);
</script>

<template>
    <section class="friendly-links-shell">
        <div class="friendly-links-card">
            <div class="friendly-links-header">
                <p class="friendly-links-eyebrow">友情链接</p>
                <h2>Gloss Mod Manager 推荐站点</h2>
                <p>实时同步站群最新友链，为 GMM 文档补齐统一的底部跳转入口。</p>
            </div>
            <div v-if="pending" class="friendly-links-state">友链加载中...</div>
            <div v-else-if="failed" class="friendly-links-state">
                友链暂时不可用，请稍后再试。
            </div>
            <div v-else class="friendly-links-grid">
                <a
                    v-for="link in links"
                    :key="link.url"
                    :href="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="friendly-links-item">
                    <span class="friendly-links-name">{{ link.name }}</span>
                    <span v-if="link.description" class="friendly-links-desc">{{
                        link.description
                    }}</span>
                </a>
            </div>
        </div>
    </section>
</template>

<style scoped>
.friendly-links-shell {
    padding: 0 24px 32px;
}

.friendly-links-card {
    max-width: 1152px;
    margin: 0 auto;
    padding: 28px;
    border: 1px solid rgba(95, 103, 238, 0.22);
    border-radius: 28px;
    background:
        radial-gradient(circle at top left, rgba(189, 52, 254, 0.2), transparent 34%),
        radial-gradient(circle at top right, rgba(65, 209, 255, 0.16), transparent 28%),
        linear-gradient(180deg, rgba(22, 24, 44, 0.96), rgba(12, 14, 28, 0.98));
    box-shadow: 0 28px 72px rgba(8, 10, 24, 0.24);
}

.friendly-links-header h2 {
    margin: 8px 0 10px;
    font-size: 1.7rem;
    color: #f7f7ff;
}

.friendly-links-header p {
    margin: 0;
    color: rgba(223, 229, 255, 0.74);
    line-height: 1.7;
}

.friendly-links-eyebrow {
    margin: 0;
    font-size: 0.75rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #c8b8ff;
}

.friendly-links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px;
    margin-top: 22px;
}

.friendly-links-item {
    display: block;
    padding: 14px 16px;
    border-radius: 18px;
    text-decoration: none;
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: rgba(255, 255, 255, 0.05);
    transition:
        transform 0.2s ease,
        border-color 0.2s ease,
        background 0.2s ease,
        box-shadow 0.2s ease;
}

.friendly-links-item:hover {
    transform: translateY(-2px);
    border-color: rgba(132, 176, 255, 0.56);
    background: rgba(95, 103, 238, 0.14);
    box-shadow: 0 10px 24px rgba(41, 62, 133, 0.24);
}

.friendly-links-name {
    display: block;
    color: #f8f9ff;
    font-weight: 600;
}

.friendly-links-desc {
    display: block;
    margin-top: 6px;
    font-size: 0.86rem;
    line-height: 1.5;
    color: rgba(223, 229, 255, 0.56);
}

.friendly-links-state {
    margin-top: 20px;
    padding: 16px 18px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.05);
    color: rgba(223, 229, 255, 0.74);
}

@media (max-width: 640px) {
    .friendly-links-shell {
        padding: 0 16px 24px;
    }

    .friendly-links-card {
        padding: 22px;
        border-radius: 22px;
    }

    .friendly-links-header h2 {
        font-size: 1.45rem;
    }
}
</style>