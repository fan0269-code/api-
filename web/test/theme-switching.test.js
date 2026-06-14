import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Theme Switching', () => {
  test('design tokens are properly defined', () => {
    // 测试设计令牌文件是否存在且包含必要的变量
    const tokensPath = path.join(__dirname, '../shared/design-tokens.css')
    const tokensContent = fs.readFileSync(tokensPath, 'utf-8')
    
    // 验证品牌色定义
    assert.ok(tokensContent.includes('--fl-500:'), '品牌主色 --fl-500 未定义')
    assert.ok(tokensContent.includes('--fl-500: #F97316'), '品牌主色值应为 #F97316')
    
    // 验证毛玻璃参数
    assert.ok(tokensContent.includes('--fl-glass-bg:'), '毛玻璃背景参数未定义')
    assert.ok(tokensContent.includes('--fl-glass-border:'), '毛玻璃边框参数未定义')
    assert.ok(tokensContent.includes('--fl-glass-blur:'), '毛玻璃模糊参数未定义')
    
    // 验证间距系统
    assert.ok(tokensContent.includes('--fl-space-xs:'), '间距系统 --fl-space-xs 未定义')
    assert.ok(tokensContent.includes('--fl-space-sm:'), '间距系统 --fl-space-sm 未定义')
    assert.ok(tokensContent.includes('--fl-space-md:'), '间距系统 --fl-space-md 未定义')
    
    // 验证圆角
    assert.ok(tokensContent.includes('--fl-radius-sm:'), '圆角 --fl-radius-sm 未定义')
    assert.ok(tokensContent.includes('--fl-radius-md:'), '圆角 --fl-radius-md 未定义')
    assert.ok(tokensContent.includes('--fl-radius-lg:'), '圆角 --fl-radius-lg 未定义')
    
    // 验证过渡动画
    assert.ok(tokensContent.includes('--fl-transition-fast:'), '过渡动画 --fl-transition-fast 未定义')
    assert.ok(tokensContent.includes('--fl-transition-base:'), '过渡动画 --fl-transition-base 未定义')
    assert.ok(tokensContent.includes('--fl-transition-slow:'), '过渡动画 --fl-transition-slow 未定义')
  })

  test('classic theme imports shared tokens', () => {
    const classicIndexPath = path.join(__dirname, '../classic/src/index.css')
    const classicContent = fs.readFileSync(classicIndexPath, 'utf-8')
    
    // 验证经典主题导入了共享设计令牌
    assert.ok(classicContent.includes("@import '../../shared/design-tokens.css'"), 
      '经典主题未导入共享设计令牌')
    
    // 验证不再使用旧的重复变量
    assert.ok(!classicContent.includes('--fl-orange-500:'), 
      '经典主题仍在使用重复的 --fl-orange-500 变量')
    assert.ok(!classicContent.includes('--fl-glass-bg: rgba(255, 255, 255, 0.04)'), 
      '经典主题仍在使用重复的毛玻璃参数定义')
  })

  test('default theme imports shared tokens', () => {
    const defaultThemePath = path.join(__dirname, '../default/src/styles/theme.css')
    const defaultContent = fs.readFileSync(defaultThemePath, 'utf-8')
    
    // 验证默认主题导入了共享设计令牌
    assert.ok(defaultContent.includes("@import '../../shared/design-tokens.css'"), 
      '默认主题未导入共享设计令牌')
  })

  test('both themes have consistent brand colors', () => {
    const tokensPath = path.join(__dirname, '../shared/design-tokens.css')
    const tokensContent = fs.readFileSync(tokensPath, 'utf-8')
    
    // 从共享令牌中提取品牌色
    const brandColorMatch = tokensContent.match(/--fl-500:\s*(#[A-Fa-f0-9]+)/)
    assert.ok(brandColorMatch, '无法从共享令牌中提取品牌色')
    const brandColor = brandColorMatch[1]
    
    // 验证品牌色值正确
    assert.equal(brandColor, '#F97316', '品牌色应为 #F97316')
  })
})
