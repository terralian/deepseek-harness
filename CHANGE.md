# 变更

这里标注了本版本的修改部分，以修复我使用时所遇到的问题。以下修复不一定是最佳方案，只是在官方未支持前的临时做法。

## 0.1.6-alpha.2
- 令dsh使用nvm来支持`.nvmrc`文件进行自动切换，以兼容老旧的node项目 [92d8638c](https://github.com/deepseek-ai/deepseek-harness/commit/92d8638c4eeaf2072352372f3443ebfa2894e172)
  > dsh本身要求node版本较高，而老旧的前端项目可能还在使用14、16等版本。dsh并不会识别nvm来进行node自动切换，所以AI每次进行编译测试时都会报错，
  > 然后就开始不断尝试变更nvm current。
  > <p>这里通过在调用bash前，将上下文中的PATH替换为NVM_HOME解决，由大肥鱼自己实现。
  > <p>不过该方案无法解决在dsh中从高版本的e2e子项目启动低版本的主项目server。
