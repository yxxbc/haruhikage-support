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

旧仓库 `yxxbc/haruhikage-app` 已经完成迁移，只剩一个 `v0.1.28` 的 bridge release，用来把旧安装送到本仓库。之后的新版本只发本仓库，不需要再跑 Bridge。

只有在需要重新迁移旧仓库时，才运行 **Bridge** workflow：

```sh
gh workflow run bridge.yml --repo yxxbc/haruhikage-support -f version=0.1.28
```

## 运行时文件

应用按需下载的模型和工具放在单独的 prerelease 里，用固定 tag 标记，不会成为本仓库的最新 release，也不会盖掉应用更新：

- `sherpa-onnx-<version>`：语音转写用的 libsherpa-onnx
- 其他按需文件沿用同样的约定

## 问题

安装、更新或启动的问题，请开 issue，并带上版本号、系统和安装包类型。
