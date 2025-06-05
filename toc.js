// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded affix "><a href="title-page.html">从 C++ 到 Rust 语法手册</a></li><li class="chapter-item expanded affix "><li class="part-title">惯用法</li><li class="chapter-item expanded "><a href="idioms/constructors.html"><strong aria-hidden="true">1.</strong> 构造函数</a><a class="toggle"><div>❱</div></a></li><li><ol class="section"><li class="chapter-item "><a href="idioms/constructors/default_constructors.html"><strong aria-hidden="true">1.1.</strong> 默认构造函数</a></li><li class="chapter-item "><a href="idioms/constructors/copy_and_move_constructors.html"><strong aria-hidden="true">1.2.</strong> 拷贝与移动构造函数</a></li><li class="chapter-item "><a href="idioms/constructors/rule_of_three_five_zero.html"><strong aria-hidden="true">1.3.</strong> 三/五/零法则</a></li></ol></li><li class="chapter-item expanded "><a href="idioms/destructors.html"><strong aria-hidden="true">2.</strong> 析构函数与资源清理</a></li><li class="chapter-item expanded "><a href="idioms/data_modeling.html"><strong aria-hidden="true">3.</strong> 数据建模</a><a class="toggle"><div>❱</div></a></li><li><ol class="section"><li class="chapter-item "><a href="idioms/data_modeling/abstract_classes.html"><strong aria-hidden="true">3.1.</strong> 抽象类、接口与动态分发</a></li><li class="chapter-item "><a href="idioms/data_modeling/concepts.html"><strong aria-hidden="true">3.2.</strong> 概念、接口与静态分发</a></li><li class="chapter-item "><a href="idioms/data_modeling/enums.html"><strong aria-hidden="true">3.3.</strong> 枚举</a></li><li class="chapter-item "><a href="idioms/data_modeling/tagged_unions.html"><strong aria-hidden="true">3.4.</strong> 标记联合与 std::variant</a></li><li class="chapter-item "><a href="idioms/data_modeling/inheritance_and_reuse.html"><strong aria-hidden="true">3.5.</strong> 继承与实现复用</a></li><li class="chapter-item "><a href="idioms/data_modeling/templates.html"><strong aria-hidden="true">3.6.</strong> 模板类、函数与方法</a></li><li class="chapter-item "><a href="idioms/data_modeling/template_specialization.html"><strong aria-hidden="true">3.7.</strong> 模板特化</a></li></ol></li><li class="chapter-item expanded "><a href="idioms/null.html"><strong aria-hidden="true">4.</strong> 空值（nullptr）</a><a class="toggle"><div>❱</div></a></li><li><ol class="section"><li class="chapter-item "><a href="idioms/null/sentinel_values.html"><strong aria-hidden="true">4.1.</strong> 哨兵值</a></li><li class="chapter-item "><a href="idioms/null/moved_members.html"><strong aria-hidden="true">4.2.</strong> 已移动成员</a></li><li class="chapter-item "><a href="idioms/null/zero_length_arrays.html"><strong aria-hidden="true">4.3.</strong> 零长度数组</a></li></ol></li><li class="chapter-item expanded "><a href="idioms/encapsulation.html"><strong aria-hidden="true">5.</strong> 封装</a><a class="toggle"><div>❱</div></a></li><li><ol class="section"><li class="chapter-item "><a href="idioms/encapsulation/headers.html"><strong aria-hidden="true">5.1.</strong> 头文件</a></li><li class="chapter-item "><a href="idioms/encapsulation/anonymous_namespaces.html"><strong aria-hidden="true">5.2.</strong> 匿名命名空间与 static</a></li><li class="chapter-item "><a href="idioms/encapsulation/private_and_friends.html"><strong aria-hidden="true">5.3.</strong> 私有成员与友元</a></li><li class="chapter-item "><a href="idioms/encapsulation/private_constructors.html"><strong aria-hidden="true">5.4.</strong> 私有构造函数</a></li><li class="chapter-item "><a href="idioms/encapsulation/setters_and_getters.html"><strong aria-hidden="true">5.5.</strong> Setter 与 Getter 方法</a></li></ol></li><li class="chapter-item expanded "><a href="idioms/exceptions.html"><strong aria-hidden="true">6.</strong> 异常与错误处理</a><a class="toggle"><div>❱</div></a></li><li><ol class="section"><li class="chapter-item "><a href="idioms/exceptions/expected_errors.html"><strong aria-hidden="true">6.1.</strong> 预期错误</a></li><li class="chapter-item "><div><strong aria-hidden="true">6.2.</strong> 表示程序缺陷的错误</div></li></ol></li><li class="chapter-item expanded "><a href="idioms/type_equivalents.html"><strong aria-hidden="true">7.</strong> 类型等价</a></li><li class="chapter-item expanded "><a href="idioms/promotions_and_conversions.html"><strong aria-hidden="true">8.</strong> 类型提升与转换</a></li><li class="chapter-item expanded "><a href="idioms/user-defined_conversions.html"><strong aria-hidden="true">9.</strong> 用户自定义转换</a></li><li class="chapter-item expanded "><a href="idioms/overloading.html"><strong aria-hidden="true">10.</strong> 重载</a></li><li class="chapter-item expanded "><div><strong aria-hidden="true">11.</strong> RTTI</div></li><li class="chapter-item expanded "><div><strong aria-hidden="true">12.</strong> 迭代器</div></li><li class="chapter-item expanded "><div><strong aria-hidden="true">13.</strong> 函数对象、Lambda 与闭包</div></li><li class="chapter-item expanded "><a href="idioms/object_identity.html"><strong aria-hidden="true">14.</strong> 对象标识</a></li><li class="chapter-item expanded "><a href="idioms/out_params.html"><strong aria-hidden="true">15.</strong> 输出参数</a><a class="toggle"><div>❱</div></a></li><li><ol class="section"><li class="chapter-item "><a href="idioms/out_params/multiple_return.html"><strong aria-hidden="true">15.1.</strong> 多返回值</a></li><li class="chapter-item "><a href="idioms/out_params/optional_return.html"><strong aria-hidden="true">15.2.</strong> 可选返回值</a></li><li class="chapter-item "><a href="idioms/out_params/pre-allocated_buffers.html"><strong aria-hidden="true">15.3.</strong> 预分配缓冲区</a></li></ol></li><li class="chapter-item expanded "><div><strong aria-hidden="true">16.</strong> 可变参数</div></li><li class="chapter-item expanded "><div><strong aria-hidden="true">17.</strong> 属性</div></li><li class="chapter-item expanded "><div><strong aria-hidden="true">18.</strong> 调用 C（FFI）</div></li><li class="chapter-item expanded "><div><strong aria-hidden="true">19.</strong> NRVO、RVO 与 placement new</div></li><li class="chapter-item expanded "><div><strong aria-hidden="true">20.</strong> 并发（线程与异步）</div></li><li class="chapter-item expanded affix "><li class="part-title">模式</li><li class="chapter-item expanded "><div><strong aria-hidden="true">21.</strong> 访问者模式与双重分发</div></li><li class="chapter-item expanded "><a href="patterns/crtp.html"><strong aria-hidden="true">22.</strong> 奇异递归模板模式（CRTP）</a></li><li class="chapter-item expanded "><div><strong aria-hidden="true">23.</strong> 实现指针（PImpl）</div></li><li class="chapter-item expanded "><div><strong aria-hidden="true">24.</strong> X 宏</div></li><li class="chapter-item expanded affix "><li class="part-title">生态系统</li><li class="chapter-item expanded "><a href="etc/libraries.html"><strong aria-hidden="true">25.</strong> 库</a></li><li class="chapter-item expanded "><div><strong aria-hidden="true">26.</strong> 单元测试</div></li><li class="chapter-item expanded "><div><strong aria-hidden="true">27.</strong> 文档（Doxygen）</div></li><li class="chapter-item expanded "><div><strong aria-hidden="true">28.</strong> 构建系统（CMake）</div></li><li class="chapter-item expanded affix "><li class="spacer"></li><li class="chapter-item expanded "><a href="notices.html"><strong aria-hidden="true">29.</strong> 归属声明</a></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0].split("?")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
