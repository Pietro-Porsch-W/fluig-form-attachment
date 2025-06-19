# Fluig Form Attachment

Plugin JQuery para auxiliar no tratamento de anexos em formulários
de processo.

A gestão dos anexos de processo no Fluig não é uma tarefa fácil. Além da aba anexos não
permitir ordenação, o Fluig não permite, de maneira simples, vincular os anexos a campos
do formulário do processo, assim devemos confiar que os usuários vão colocar os anexos
corretamente na aba anexos e depois gastar tempo identificando cada anexo, pois usuários
dificilmente respeitarão alguma regra de nomenclatura.

Para permitir esse vínculo entre os campos do formulário e os anexos o
[Sérgio Machado](https://www.linkedin.com/in/sergio-machado-analista-fluig/)
criou o [ComponenteAnexos](https://github.com/sergiomachadosilva/fluig-utils/tree/main/projetos/ComponenteAnexos), que é uma biblioteca JS/CSS/HTML, permitindo um maior controle dos
anexos. Esse projeto do Sérgio serviu como base para a construção desse Plugin JQuery.

A intenção desse plugin é simplificar ainda mais o tratamento dos anexos em formulários
que estão abertos em um Processo.

## Atenção

Esse plugin não funciona na versão mobile dentro do aplicativo My Fluig.

## Instalação

Basta adicionar o script `fluigFormAttachment.js` ou `fluigformAttachment.min.js` ao
seu formulário.

## Modo de usar

Ao carregar o plugin no seu formulário ele ocultará a Aba Anexos do Fluig, evitando que
insiram documentos não solicitados e, mais importante, removam anexos que já estão
vinculados a um campo do formulário.

### Básico

Basta ter um campo do tipo texto e instanciar o plugin para esse campo.

```html
<div class="form-group">
    <label for="cnh">Teste 001</label>
    <input type="text" class="form-control" readonly name="cnh" id="cnh" data-filename="CNH" data-accept="image/*,.pdf">
</div>
```

É recomendável deixar o campo como `readonly`. O plugin fará isso automaticamente quando
instanciado no elemento, mas pode ser que algum usuário consiga editar o formulário fora
do processo e nesse caso o plugin não funcionará.

O atributo `data-filename` indica a "descrição" do anexo, que é o valor que aparece na Aba
Anexos. Esse nome será utilizado para vincular o campo do formulário ao anexo.

Então no JavaScript basta executar:

```javascript
$("#cnh").fluigFormAttachment();
```

### Parâmetros

Ao instanciar o plugin para os elementos é possível passar um objeto com as seguintes
propriedades de configuração:

- **showActionButton**: indica se deve exibir os botões de Ação (Upload e Delete). `true` por padrão, `false` para não exibir (campo que não deve permitir upload/delete no momento);
- **filename**: a descrição/nome do anexo. Caso exista o atributo `data-filename` no campo do formulário ele terá preferência;
- **prefixName**:  Adiciona prefixo à descrição do anexo. `false` por padrão. `true` para prefixo aleatório (será usado um pedaço de um UUID) ou uma `string` para um prefixo fixo.
- **accept**: funciona igual ao atributo accept do input file. Caso exista o atributo `data-accept` no campo do formulário ele terá preferência;

Quando o campo estiver **Desabilitado** o botão de Upload/Delete não será exibido, mesmo se
o parâmetro `showActionButton` estiver como `true`.

A intenção da configuração `prefixName` é auxiliar nos casos de Tabela Pai Filho.

Exemplos:

```javascript
$("#cnh").fluigFormAttachment({
    showActionButton: false,
});

// Tabela Pai Filho
$("#adicionar").on("click", function () {
    const index = wdkAddChild("tabelaPaiFilho");
    $(`#cnh___${index}`).fluigFormAttachment({
        prefixName: true,
    });
});

// Tabela Pai Filho com vários campos de anexo
$("#adicionar").on("click", function () {
    const index = wdkAddChild("tabelaPaiFilho");
    const tr = $(`#cnh___${index}`).closest("tr");

    // A cada upload será criado um prefixo aleatório pra cada anexo
    $(".anexos", tr).fluigFormAttachment({
        prefixName: true,
    });
});

// Tabela Pai Filho com vários campos de anexo e prefixo único pra linha
$("#adicionar").on("click", function () {
    const index = wdkAddChild("tabelaPaiFilho");
    const tr = $(`#cnh___${index}`).closest("tr");

    // A cada upload usará o mesmo prefixo para todos os anexos da linha
    $(".anexos", tr).fluigFormAttachment({
        prefixName: FLUIGC.utilities.randomUUID().substring(0, 8),
    });
});
```

### Métodos

É possível executar alguns métodos do Plugin para manipular os anexos. Os seguintes
métodos estão disponíveis:

- **hasAttachment**: Indica se o campo possuí anexo (tem descrição e o anexo está na tabela de anexos). Este método é executado em um único campo;
- **isValid**: Indica se o campo está válido. Caso ele possua um valor (foi feito upload do anexo), mas o anexo não está na tabela de anexos, indicará campo inválido. Este método é executado em um único campo;
- **deleteAttachment**: Remove o anexo daquele campo. Útil para quando excluir uma linha de uma tabela Pai Filho;

Para executar um método basta chamar o plugin no campo indicando passando o nome do método ao invés
do objeto de parâmetros.

Exemplos:

```javascript
if ($("#cnh").fluigFormAttachment("hasAttachment")) {
    // Exemplo: habilitar outro campo de preenchimento
}

function beforeSendValidate(numState, nextState) {
    if (!$("#cnh").fluigFormAttachment("isValid")) {
        throw "O Anexo da CNH não foi enviado corretamente. Remova-o e envie novamente";
    }
}

// Removendo anexos da Pai Filho ao excluir linha
$("#tabelaPaiFilho").on("click", ".removeItem", function() {
    $(".anexos", this.closest("tr")).fluigFormAttachment("deleteAttachment");
    fnWdkRemoveChild(this);
});
```
