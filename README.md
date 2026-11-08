# haruhikage-support

春日影的发布仓库：安装包、签名更新清单，以及应用运行时按需下载的文件。

## 春日影

每个 `v<version>` 的 release 放 macOS、Windows、Linux 的安装包，以及已安装应用更新用的签名清单。应用检查本仓库的最新 release，所以发布顺序是：

1. 在源码仓库改 `mygo.json` 的 `version`，写好 `CHANGELOG.md`
2. 打 tag `v<version>`，推 tag
3. 在 Actions 里运行 **Release**，`ref` 填 `v<version>`
4. 看一眼生成的 draft release，确认各平台都在，再发布：

```sh
gh release edit v0.1.0 --repo yxxbc/haruhikage-support --draft=false --latest
```

发布后，已安装的应用下次检查更新时就会看到它。

旧仓库 `yxxbc/haruhikage-app` 里的安装还在检查旧仓库的更新。发布后运行 **Bridge** workflow，把同一版本的更新清单发到旧仓库，旧安装就会升级过来，之后检查本仓库：

```sh
gh workflow run bridge.yml --repo yxxbc/haruhikage-support -f version=0.1.28
```

## 运行时文件

应用按需下载的模型和工具放在单独的 prerelease 里，用固定 tag 标记，不会成为本仓库的最新 release，也不会盖掉应用更新：

- `sherpa-onnx-<version>`：语音转写用的 libsherpa-onnx
- 其他按需文件沿用同样的约定

## 问题

安装、更新或启动的问题，请开 issue，并带上版本号、系统和安装包类型。
