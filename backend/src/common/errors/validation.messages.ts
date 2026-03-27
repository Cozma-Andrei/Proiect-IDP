const validationMessages: { [key: string]: string } = {
    'string.base': 'trebuie să fie un text',
    'string.empty': 'nu poate fi un câmp gol',
    'string.min': 'trebuie să aibă o lungime minimă de {#limit} caractere',
    'string.max': 'should have a minimum length of {#limit}',
    'string.alphanum': 'trebuie să conțină doar caractere alfanumerice',
    'string.pattern.base': 'trebuie să respecte formatul',
    'any.required': 'este un câmp obligatoriu',
};

export default validationMessages;
