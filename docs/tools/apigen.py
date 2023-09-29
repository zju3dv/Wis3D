import os
import re
from inspect import getmodule

from types import BuiltinFunctionType, FunctionType


class ApiDocWriter(object):
    ''' Class for automatic detection and parsing of API docs
    to Sphinx-parsable reST format'''

    # only separating first two levels
    rst_section_levels = ['*', '=', '-', '~', '^']
    rst_extension = '.rst'

    def __init__(self,
                 package_name,
                 package_skip_patterns=None,
                 module_skip_patterns=None,
                 include_classes=None,
                 ):
        self.package_name = package_name
        self.package_skip_patterns = package_skip_patterns
        self.module_skip_patterns = module_skip_patterns
        self.include_classes = include_classes

    def get_package_name(self):
        return self._package_name

    def set_package_name(self, package_name):
        self._package_name = package_name
        mod = __import__(package_name)
        components = package_name.split('.')
        for comp in components[1:]:
            mod = getattr(mod, comp)
        root_module = mod
        self.root_path = root_module.__path__[-1]
        self.written_modules = None

    package_name = property(get_package_name, set_package_name, None,
                            'get/set package_name')

    def uri2path(self, uri):
        ''' Convert uri to absolute filepath'''
        if uri == self.package_name:
            return os.path.join(self.root_path, '__init__.py')
        path = uri.replace(self.package_name + '.', '')
        path = path.replace('.', os.path.sep)
        path = os.path.join(self.root_path, path)
        if os.path.exists(path + '.py'):
            path += '.py'
        elif os.path.exists(os.path.join(path, '__init__.py')):
            path = os.path.join(path, '__init__.py')
        else:
            return None
        return path

    def path2uri(self, dirpath):
        ''' Convert directory path to uri '''
        package_dir = self.package_name.replace('.', os.path.sep)
        relpath = dirpath.replace(self.root_path, package_dir)
        if relpath.startswith(os.path.sep):
            relpath = relpath[1:]
        return relpath.replace(os.path.sep, '.')

    def parse_module_with_import(self, uri):
        """ Look for functions and classes in an importable module."""
        mod = __import__(uri, fromlist=[uri.split('.')[-1]])
        # find all public objects in the module.
        obj_strs = [obj for obj in dir(mod) if not obj.startswith('_')]
        functions = []
        classes = []
        for obj_str in obj_strs:
            # find the actual object from its string representation
            if obj_str not in mod.__dict__:
                continue
            obj = mod.__dict__[obj_str]
            # Check if function / class defined in module
            if not getmodule(obj) == mod:
                continue
            # figure out if obj is a function or class
            if isinstance(obj, (FunctionType, BuiltinFunctionType)):
                if self.include_classes == None:
                    functions.append(obj_str)
            else:
                try:
                    issubclass(obj, object)
                    if self.include_classes:
                        if self.include_classes[mod.__name__] == obj_str:
                            classes.append(obj_str)
                except TypeError:
                    # not a function or class
                    pass
        return functions, classes

    def update_two_dim_dict(self, target_dict, key_a, key_b, val):
        if key_a in target_dict:
            target_dict[key_a].update({key_b: val})
        else:
            target_dict.update({key_a: {key_b: val}})

    def get_class_func(self, uri):
        filename = self.uri2path(uri)
        functions = {}

        if filename is None:
            return functions

        f = open(filename, 'rt')
        prevline = ''
        docstring = []
        record_flag = -1
        for line in f:
            if record_flag == 0 or record_flag == 1:
                if line.strip() == "'''" or line.strip() == '"""':
                    record_flag += 1
                else:
                    docstring.append(line)
            if record_flag == 2:
                self.update_two_dim_dict(functions, name, func, docstring)
                docstring = []
                record_flag = -1
            if line.startswith('    def '):
                name = line.split()[1].split('(')[0].strip()
                func = line[8:-2]
                if name[0:2] == '__':
                    continue
                if prevline.strip() == '@overload':
                    record_flag += 1
                    self.update_two_dim_dict(functions, name, func, '')
                else:
                    if not name in functions:
                        self.update_two_dim_dict(functions, name, func, '')
            prevline = line

        f.close()
        return functions

    def generate_func_docstring(self, docstring: str):
        res_string = ''
        param_flag = 0
        for line in docstring:
            if line.strip().split(' ')[0] == ':param':
                if param_flag == 0:
                    param_flag = 1
                    res_string += '   :Parameters:   '
                else:
                    res_string += '      '
                params = line.strip().split(':')
                res_string += '**' + params[1][6:] + '**' + ' -' + ':'.join(params[2:]) + '\n'
            else:
                if param_flag == 0:
                    res_string += '   ' + line.strip() + '\n'
                else:
                    res_string += line
        return res_string

    def generate_api_doc(self, uri):
        ''' Make autodoc documentation string for a module'''
        # get the names of all classes and functions
        functions, classes = self.parse_module_with_import(uri)
        if not len(functions) and not len(classes):
            print('WARNING: Empty -', uri)  # dbg

        # Make a shorter version of the uri that omits the package name for
        # titles
        uri_short = re.sub(r'^%s\.' % self.package_name, '', uri)
        head = '.. AUTO-GENERATED FILE \n\n'
        body = ''

        head += '\n.. automodule:: ' + uri + '\n'
        head += '\n.. currentmodule:: ' + uri + '\n'
        body += '\n.. currentmodule:: ' + uri + '\n\n'
        for c in classes:
            body += '\n:class:`' + c + '`\n' \
                    + self.rst_section_levels[0] * \
                    (len(c) + 9) + '\n\n'

            body += '.. automethod:: ' + c + '.__init__' + '\n\n'

            class_functions = self.get_class_func(uri)
            for type in class_functions:
                body += type + '\n' + self.rst_section_levels[1] * (len(type)) + '\n\n'
                for func in class_functions[type]:
                    if class_functions[type][func] == '':
                        body += '.. automethod:: ' + c + '.' + func + '\n\n'
                    else:
                        body += '.. method:: ' + c + '.' + func + '\n   :noindex: \n\n'
                        body += self.generate_func_docstring(class_functions[type][func]) + '\n\n'

        for f in functions:
            # must NOT exclude from index to keep cross-refs working
            body += f + '\n'
            body += self.rst_section_levels[1] * len(f) + '\n'
            body += '\n.. autofunction:: ' + f + '\n   :noindex: \n\n'

        return head, body

    def survives_exclude(self, matchstr, match_type):
        if match_type == 'module':
            patterns = self.module_skip_patterns
        elif match_type == 'package':
            patterns = self.package_skip_patterns
        else:
            raise ValueError('Cannot interpret match type "%s"'
                             % match_type)
        # Match to URI without package name
        L = len(self.package_name)
        if matchstr[:L] == self.package_name:
            matchstr = matchstr[L:]
        for pat in patterns:
            try:
                pat.search
            except AttributeError:
                pat = re.compile(pat)
            if pat.search(matchstr):
                return False

        return True

    def discover_modules(self):
        ''' Return module sequence discovered from ``self.package_name`'''
        modules = [self.package_name]
        # raw directory parsing
        for dirpath, dirnames, filenames in os.walk(self.root_path):
            # Check directory names for packages
            root_uri = self.path2uri(os.path.join(self.root_path,
                                                  dirpath))

            # Normally, we'd only iterate over dirnames, but since
            # dipy does not import a whole bunch of modules we'll
            # include those here as well (the *.py filenames).
            filenames = [f[:-3] for f in filenames if
                         f.endswith('.py') and not f.startswith('__init__')]
            for filename in filenames:
                package_uri = '/'.join((dirpath, filename))

            for subpkg_name in dirnames + filenames:
                package_uri = '.'.join((root_uri, subpkg_name))
                package_path = self.uri2path(package_uri)
                if (package_path and
                        self.survives_exclude(package_uri, 'package')):
                    modules.append(package_uri)

        return sorted(modules)

    def write_modules_api(self, modules, outdir):
        # upper-level modules
        main_module = modules[0].split('.')[0]
        ulms = ['.'.join(m.split('.')[:2]) if m.count('.') >= 1
                else m.split('.')[0] for m in modules]

        from collections import OrderedDict
        module_by_ulm = OrderedDict()

        for v, k in zip(modules, ulms):
            if k in module_by_ulm:
                module_by_ulm[k].append(v)
            else:
                module_by_ulm[k] = [v]

        written_modules = []

        for ulm, mods in module_by_ulm.items():
            print("Generating docs for %s:" % ulm)
            document_head = []
            document_body = []

            for m in mods:
                print("  -> " + m)
                head, body = self.generate_api_doc(m)

                document_head.append(head)
                document_body.append(body)

            out_module = ulm + self.rst_extension
            outfile = os.path.join(outdir, out_module)
            fileobj = open(outfile, 'wt')

            fileobj.writelines(document_head + document_body)
            fileobj.close()
            written_modules.append(out_module)

        self.written_modules = written_modules

    def write_api_docs(self, outdir):
        '''Generate API reST files.'''
        if not os.path.exists(outdir):
            os.mkdir(outdir)
        # compose list of modules
        # only need class wis3d api
        modules = self.discover_modules()[1:]
        self.write_modules_api(modules, outdir)

    def write_index(self, outdir, froot='gen', relative_to=None):
        '''Make a reST API index file from written files'''
        print(self.written_modules)
        if self.written_modules is None:
            raise ValueError('No modules written')
        # Get full filename path
        path = os.path.join(outdir, froot + self.rst_extension)
        # Path written into index is relative to rootpath
        if relative_to is not None:
            relpath = (
                    outdir + os.path.sep).replace(relative_to + os.path.sep, '')
        else:
            relpath = outdir
        idx = open(path, 'wt')
        w = idx.write
        w('.. AUTO-GENERATED FILE\n\n')

        title = "Python API"
        w(title + "\n")
        w("=" * len(title) + "\n\n")
        w('.. toctree::\n   :maxdepth: 2\n\n')
        for f in self.written_modules:
            w('   %s\n' % f)
        idx.close()


def main():
    api_gen = ApiDocWriter("wis3d", ['\\.server$', '\\.version'], include_classes={'wis3d.wis3d': 'Wis3D'})
    api_gen.get_class_func("wis3d.wis3d")


if __name__ == '__main__':
    main()
