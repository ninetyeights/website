# braces 临时安全补丁

针对 GHSA-vfj7-8cjw-p6xm 的项目维护补丁，仍使用上游 braces 3.0.3；并非上游官方修复版本。

补丁包含上游源文件内容，保留其 MIT 许可声明于 braces-LICENSE。

`npm ci` / `npm install` 的 postinstall 执行 `scripts/apply-braces-patch.mjs`。Docker builder 在安装前复制脚本和补丁。脚本校验版本及原文件 SHA-256，允许重复应用，但遇到未知内容立即失败。没有增加额外 npm 依赖。

解析器在沿用原有转义、引号和字符类语法的基础上限制解析栈；compile、expand、stringify 在递归前以迭代方式校验 AST。最多允许 32 层 AST 深度（包含根及叶节点），最多 100000 个 AST 节点；循环或共享节点拒绝。限制不能由调用方选项关闭。超过限制抛出带 `ERR_BRACES_COMPLEXITY` 的 RangeError；普通花括号、圆括号、范围、转义和引号由回归测试验证。

此补丁仅保护已知的深层嵌套栈耗尽路径，不保证阻止所有展开组合导致的内存耗尽或其他未知漏洞。npm audit 依据版本仍会报告原告警。工具继续只处理可信输入。

如果使用 `--ignore-scripts` 安装全部依赖，必须随后手动执行 `node scripts/apply-braces-patch.mjs`，再运行 `node --test tests/braces-security.test.mjs`。如果安装时省略开发依赖且 braces 不存在，则跳过补丁。不要在现有安装中手工还原依赖文件。

官方修复发布后：核对公告受影响范围，升级实际引入它的依赖/锁文件；确认新版本覆盖深层嵌套以及直接 AST 入口；移除 postinstall、安装脚本、补丁 JSON 和 Docker 中对应 COPY；使用全新 npm ci 并运行安全回归、npm test、Lint、类型检查和构建。保留并按官方错误行为调整攻击输入测试。版本升级会让当前安装脚本主动失败，提示完成上述评估。
