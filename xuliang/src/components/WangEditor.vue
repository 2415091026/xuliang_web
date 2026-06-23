<template>
  <div class="editor-container border rounded-md overflow-hidden flex flex-col"
    :class="{ 'is-disabled pointer-events-none': disabled }">
    <!-- 富文本工具栏 -->
    <Toolbar v-if="!disabled" class="editor-toolbar" :editor="editorRef" :defaultConfig="toolbarConfig"
      mode="default" />
    <!-- 富文本编辑器主体 -->
    <Editor class="overflow-y-hidden" :style="{ height: height }" v-model="valueHtml" :defaultConfig="editorConfig"
      mode="default" @onCreated="handleCreated" @onChange="handleChange" />
  </div>
</template>

<script setup>
// 引入 wangEditor 官方样式
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, ref, shallowRef, watch, computed } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import request from '../utils/request'
import { ElMessage, ElLoading } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  height: {
    type: String,
    default: '350px'
  },
  placeholder: {
    type: String,
    default: '请输入内容...'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// 【核心防坑】：在 Vue 3 中，编辑器实例必须使用 shallowRef 进行浅层代理。
// 严禁使用 ref，否则 Vue 会对 Slate 编辑器内核进行深度响应式 Proxy 劫持，从而导致内容更新死循环、光标丢失或卡死。
const editorRef = shallowRef()

// 绑定编辑器内容的内部变量
const valueHtml = ref('')

// 监听父组件传入的 modelValue，并同步到编辑器中
watch(
  () => props.modelValue,
  (val) => {
    if (val === valueHtml.value) return
    valueHtml.value = val || ''
  },
  { immediate: true }
)

// 工具栏配置对象
const toolbarConfig = {}

// 自定义图片上传函数
const customImageUpload = async (file, insertFn) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await request.post('/admin/common/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res && res.code === 200 && res.data?.url) {
      // 成功后插入编辑器
      insertFn(res.data.url, res.data.fileName, res.data.url)
    } else {
      ElMessage.error(res?.msg || '图片上传失败，未获取到有效链接')
    }
  } catch (err) {
    console.error('图片上传异常：', err)
    ElMessage.error('图片上传失败：' + (err.message || '网络连接异常'))
  }
}

// 自定义视频分片上传函数
const customVideoUpload = async (file, insertFn) => {
  const chunkSize = 2 * 1024 * 1024 // 单个切片大小设为 2MB
  const totalChunks = Math.ceil(file.size / chunkSize)
  const fileName = file.name

  // 启动全局 Loading
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在初始化视频分片上传...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  try {
    // 1. 获取用于分片标识的上传任务 ID
    const initRes = await request.get('/admin/common/upload/chunk/uploadId')
    if (!initRes || initRes.code !== 200 || !initRes.data?.uploadId) {
      throw new Error(initRes?.msg || '上传任务初始化失败')
    }
    const uploadId = initRes.data.uploadId

    // 2. 依次切片上传
    for (let i = 0; i < totalChunks; i++) {
      loadingInstance.setText(`正在上传视频分片 (${i + 1}/${totalChunks})...`)

      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunkBlob = file.slice(start, end)

      const formData = new FormData()
      formData.append('file', chunkBlob)
      formData.append('index', i.toString()) // 传后端要求的分片索引 (0-indexed)
      formData.append('totalChunks', totalChunks.toString())
      formData.append('uploadId', uploadId)
      formData.append('fileName', fileName)

      const uploadRes = await request.post('/admin/common/upload/chunk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (!uploadRes || uploadRes.code !== 200) {
        throw new Error(uploadRes?.msg || `分片 ${i + 1} 上传出错`)
      }
    }

    // 3. 所有切片上传完，发起合并请求
    loadingInstance.setText('正在合并分片，请稍候...')
    const mergeRes = await request.post('/admin/common/upload/chunk/merge', {
      uploadId,
      fileName
    })

    if (mergeRes && mergeRes.code === 200 && mergeRes.data?.url) {
      loadingInstance.close()
      ElMessage.success('视频分片上传并合并成功！')
      // 成功后插入编辑器
      insertFn(mergeRes.data.url, mergeRes.data.url)
    } else {
      throw new Error(mergeRes?.msg || '切片合并请求失败')
    }
  } catch (err) {
    loadingInstance.close()
    console.error('视频分片上传异常：', err)
    ElMessage.error('视频上传失败：' + (err.message || '网络连接异常'))
  }
}

// 编辑器配置对象，基于 computed 以便感知 props 属性的变化（如只读状态和占位符）
const editorConfig = computed(() => {
  return {
    placeholder: props.placeholder,
    readOnly: props.disabled,
    MENU_CONF: {
      uploadImage: {
        customUpload: customImageUpload
      },
      uploadVideo: {
        customUpload: customVideoUpload
      }
    }
  }
})

// 编辑器实例化完成后的回调
const handleCreated = (editor) => {
  editorRef.value = editor
}

// 变更回调，当编辑器内容更新时触发并同步给父组件
const handleChange = (editor) => {
  const html = editor.getHtml()
  valueHtml.value = html
  emit('update:modelValue', html)
  emit('change', html)
}

// 组件卸载前，必须手动调用 destroy 销毁编辑器实例以释放内存，避免闭包及内存泄漏
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
</script>

<style scoped>
/* 外部整体容器的样式控制 */
.editor-container {
  border-color: rgba(255, 255, 255, 0.08) !important;
  background-color: #101116;

  /* 定义 wangEditor v5 暗色主题变量，使其高度适配当前项目的磨砂黑金主题 */
  --w-e-textarea-bg-color: #101116;
  /* 编辑区背景色 */
  --w-e-textarea-color: #fff8ea;
  /* 编辑区文字颜色（项目主调暖白金） */
  --w-e-toolbar-bg-color: #16171d;
  /* 工具栏背景色 */
  --w-e-toolbar-color: rgba(255, 255, 255, 0.7);
  /* 工具栏文字/图标颜色 */
  --w-e-toolbar-border-color: rgba(255, 255, 255, 0.08);
  /* 下拉菜单边框 */
  --w-e-toolbar-active-bg-color: rgba(255, 255, 255, 0.1);
  /* 按钮激活时的背景色 */
  --w-e-toolbar-active-color: #f2b84b;
  /* 按钮激活时的文字颜色（金黄色） */
  --w-e-toolbar-item-hover-bg-color: rgba(255, 255, 255, 0.05);
  /* 按钮悬浮背景 */
}

/* 禁用状态下的半透明和暗边框效果 */
.editor-container.is-disabled {
  background-color: rgba(0, 0, 0, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.04) !important;
}

/* 工具栏底边框线颜色 */
.editor-toolbar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

/* ========================================================================= */
/* 【核心解决】利用 CSS 穿透与标准 CSS 恢复被 Tailwind Preflight 破坏的样式 */
/* ========================================================================= */
:deep(.w-e-text-container [data-slate-editor]) {

  /* 恢复标题标签的原始字体大小和加粗效果 */
  h1 {
    font-size: 1.875rem;
    font-weight: bold;
    margin-top: 1rem;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: bold;
    margin-top: 0.75rem;
    margin-bottom: 0.75rem;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: bold;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  h4 {
    font-size: 1.125rem;
    font-weight: bold;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  h5 {
    font-size: 1rem;
    font-weight: bold;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
  }

  /* 恢复正常段落间距与行高 */
  p {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    line-height: 1.625;
  }

  /* 恢复无序列表和有序列表的小圆点、序号以及缩进 */
  ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }

  /* 恢复超链接的下划线和颜色变化 */
  a {
    color: #f2b84b;
    text-decoration: underline;
  }

  a:hover {
    color: #e0a63b;
  }

  /* 恢复引用排版的样式 */
  blockquote {
    border-left-width: 4px;
    border-color: #f2b84b;
    padding-left: 1rem;
    font-style: italic;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    color: rgba(255, 255, 255, 0.6);
  }
}

/* ========================================================================= */
/* 对下拉菜单与弹出悬浮层的背景和边框进行强制暗色兼容，防止亮白背景突兀 */
/* ========================================================================= */
:deep(.w-e-select-list) {
  background-color: #16171d !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;

  ul {
    li {
      color: rgba(255, 255, 255, 0.7) !important;
      background-color: transparent !important;

      &:hover {
        background-color: rgba(255, 255, 255, 0.05) !important;
        color: #f2b84b !important;
      }

      &.active {
        background-color: rgba(255, 255, 255, 0.1) !important;
        color: #f2b84b !important;
      }
    }
  }
}

:deep(.w-e-panel-container) {
  background-color: #16171d !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #fff8ea !important;

  button {
    color: rgba(255, 255, 255, 0.7) !important;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
  }

  input[type="text"] {
    background-color: #101116 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #fff !important;
  }
}
</style>
